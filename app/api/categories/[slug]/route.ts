import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getRedis } from "@/lib/redis";

// Tells a CDN it may cache this response (see notes below in the walkthrough)
const CDN_HEADERS = {
  "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
};

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const key = `category:${params.slug}`; // one cache entry per slug
  const redis = getRedis();
  const cached = await redis.get(key);
  if (cached !== null) {
    const value = JSON.parse(cached);
    // "null" was cached earlier, meaning "this slug does not exist"
    if (value === null) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(value, { headers: CDN_HEADERS });
  }

  const [rows]: any = await db.query("SELECT * FROM categories WHERE slug = ?", [params.slug]);
  const data = rows[0] ?? null; // no row -> null instead of undefined
  // Cache "not found" too, but only for 60s
  await redis.set(key, JSON.stringify(data), "EX", data ? 300 : 60);
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data, { headers: CDN_HEADERS });
}
