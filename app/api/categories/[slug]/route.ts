import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getRedis } from "@/lib/redis";

const TTL_SECONDS = 300; // cache a found category for 5 min
const NOT_FOUND_TTL_SECONDS = 60; // cache "not found" briefly so bad slugs can't hammer MySQL
const CDN_HEADERS = {
  // s-maxage: CDN may keep it 60s. stale-while-revalidate: serve stale while refreshing.
  "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
};

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const { slug } = params;
  const key = `category:${slug}`; // key includes the slug -> one entry per category

  // 1. Try cache. If Redis is down, fall through to the DB instead of failing.
  const redis = getRedis();
  let cached: string | null = null;
  try {
    cached = await redis.get(key);
  } catch {}

  if (cached !== null) {
    const value = JSON.parse(cached);
    if (value === null) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(value, { headers: CDN_HEADERS });
  }

  // 2. Cache miss -> MySQL, with a PARAMETERIZED query (the ? prevents SQL injection).
  const [rows]: any = await db.query("SELECT id, slug, name FROM categories WHERE slug = ?", [slug]);
  const data = rows[0] ?? null;

  // 3. Store result (including "not found") with a TTL.
  try {
    await redis.set(key, JSON.stringify(data), "EX", data ? TTL_SECONDS : NOT_FOUND_TTL_SECONDS);
  } catch {}

  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data, { headers: CDN_HEADERS });
}
