import { db } from "@/lib/db";
import { getRedis } from "@/lib/redis";

const LIST_TTL = 60; // list pages: short, because we can't delete every page/filter key on edit
const ONE_TTL = 300; // single template: longer, we can delete this key precisely on edit
const MISSING_TTL = 60; // "not found" answers

// Cache key must include EVERY input that changes the result.
const listKey = (category: string, q: string, page: number, limit: number) =>
  `tpl:list:${category}:${q}:${page}:${limit}`;
export const oneKey = (slug: string) => `tpl:one:${slug}`;

// Redis is an optimization. If it fails, fall back to MySQL instead of failing the page.
async function cacheGet(key: string): Promise<any | undefined> {
  try {
    const v = await getRedis().get(key);
    return v === null ? undefined : JSON.parse(v); // undefined = not cached, null = cached "not found"
  } catch {
    return undefined;
  }
}
async function cacheSet(key: string, value: unknown, ttl: number) {
  try {
    await getRedis().set(key, JSON.stringify(value), "EX", ttl);
  } catch {}
}

// Task 1: build your data layer here.
// Read from MySQL, cache in Redis, and use it from both pages and API routes.

export type Template = {
  id: number;
  slug: string;
  title: string;
  category: string;
  thumbnailUrl: string;
  views: number;
};

export type TemplateQuery = {
  category?: string;
  q?: string;
  page?: number;
  limit?: number;
};

export async function getTemplates(
  query: TemplateQuery
): Promise<{ items: Template[]; total: number }> {
  // 1. Clean the input. Never trust page/limit from the URL.
  const page = Math.max(1, Math.floor(Number(query.page)) || 1);
  const limit = Math.min(48, Math.max(1, Math.floor(Number(query.limit)) || 24));
  const category = (query.category ?? "").trim().toLowerCase();
  const q = (query.q ?? "").trim().slice(0, 100);

  // Cache-aside: look in Redis first.
  const key = listKey(category, q, page, limit);
  const cached = await cacheGet(key);
  if (cached !== undefined) return cached;

  // 2. Build the WHERE clause. Conditions are fixed text, values go in `params`.
  const where: string[] = ["t.status = 'published'"];
  const params: (string | number)[] = [];
  if (category) {
    where.push("c.slug = ?");
    params.push(category);
  }
  if (q) {
    // Prefix search ("res%"). Escape LIKE wildcards typed by the user.
    where.push("t.title LIKE ?");
    params.push(`${q.replace(/[\\%_]/g, "\\$&")}%`);
  }
  const whereSql = where.join(" AND ");

  // 3. Run the total count and the page of rows at the same time.
  const [[countRow], [rows]]: any = await Promise.all([
    db.query(
      `SELECT COUNT(*) AS total
         FROM templates t JOIN categories c ON c.id = t.category_id
        WHERE ${whereSql}`,
      params
    ),
    db.query(
      `SELECT t.id, t.slug, t.title, t.thumbnail_path, t.views, c.name AS category
         FROM templates t JOIN categories c ON c.id = t.category_id
        WHERE ${whereSql}
        ORDER BY t.created_at DESC, t.id DESC
        LIMIT ? OFFSET ?`,
      [...params, limit, (page - 1) * limit]
    ),
  ]);

  const result = { items: rows.map(toTemplate), total: Number(countRow[0].total) };
  await cacheSet(key, result, LIST_TTL);
  return result;
}

// Turn a database row into the shape the app uses.
function toTemplate(r: any): Template {
  return {
    id: Number(r.id),
    slug: r.slug,
    title: r.title,
    category: r.category,
    // thumbnailUrl is computed here, it is not stored in the database
    thumbnailUrl: `${process.env.CDN_BASE_URL}${r.thumbnail_path}`,
    views: Number(r.views), // mysql2 returns BIGINT as a string
  };
}

export async function getTemplateBySlug(slug: string): Promise<Template | null> {
  const key = oneKey(slug);
  const cached = await cacheGet(key);
  if (cached !== undefined) return cached; // may be null = cached "not found"

  const [rows]: any = await db.query(
    `SELECT t.id, t.slug, t.title, t.thumbnail_path, t.views, c.name AS category
       FROM templates t
       JOIN categories c ON c.id = t.category_id
      WHERE t.slug = ? AND t.status = 'published'`,
    [slug]
  );
  const result = rows[0] ? toTemplate(rows[0]) : null;
  await cacheSet(key, result, result ? ONE_TTL : MISSING_TTL);
  return result;
}
