import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getRedis } from "@/lib/redis";

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const redis = getRedis();
  const cached = await redis.get("category");
  if (cached) return NextResponse.json(JSON.parse(cached));

  const [rows]: any = await db.query(
    `SELECT * FROM categories WHERE slug = '${params.slug}'`
  );
  const data = rows[0];
  await redis.set("category", JSON.stringify(data));
  return NextResponse.json(data);
}
