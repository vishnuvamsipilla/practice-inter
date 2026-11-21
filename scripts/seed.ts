import "dotenv/config";
import mysql from "mysql2/promise";

const TOTAL_TEMPLATES = 50_000;
const BATCH_SIZE = 1_000;

const CATEGORIES = [
  "Resume", "Cover Letter", "Invoice", "Flyer", "Poster", "Certificate",
  "Business Card", "Brochure", "Newsletter", "Menu", "Invitation", "Report",
  "Proposal", "Contract", "Letter", "Calendar", "Planner", "Presentation",
  "Social Media Post", "Logo",
];

const STYLES = [
  "Modern", "Minimal", "Simple", "Creative", "Professional", "Elegant", "Bold",
  "Classic", "Clean", "Colorful", "Corporate", "Vintage", "Playful", "Formal",
];

const USES = [
  "for Students", "for Small Business", "for Restaurants", "for Teachers",
  "for Startups", "for Nurses", "for Designers", "for Real Estate",
  "for Events", "for Freelancers", "for Schools", "for Nonprofits", "",
];

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickStatus() {
  const r = Math.random();
  if (r < 0.85) return "published";
  if (r < 0.95) return "draft";
  return "archived";
}

async function main() {
  const db = await mysql.createConnection({ uri: process.env.DATABASE_URL });
  console.log("Clearing tables...");
  await db.query("TRUNCATE TABLE templates");
  await db.query("TRUNCATE TABLE categories");

  console.log("Inserting categories...");
  await db.query("INSERT INTO categories (slug, name) VALUES ?", [
    CATEGORIES.map((name) => [slugify(name), name]),
  ]);

  console.log(`Inserting ${TOTAL_TEMPLATES} templates...`);
  for (let start = 0; start < TOTAL_TEMPLATES; start += BATCH_SIZE) {
    const rows = [];
    for (let i = start; i < Math.min(start + BATCH_SIZE, TOTAL_TEMPLATES); i++) {
      const categoryIndex = Math.floor(Math.random() * CATEGORIES.length);
      const title = [pick(STYLES), CATEGORIES[categoryIndex], pick(USES)].filter(Boolean).join(" ");
      const slug = `${slugify(title)}-${i + 1}`;
      const daysAgo = Math.floor(Math.random() * 730);
      const createdAt = new Date(Date.now() - daysAgo * 86_400_000);
      rows.push([
        slug,
        title,
        categoryIndex + 1,
        `/seed/${slug}/600/800`,
        pickStatus(),
        Math.floor(Math.random() ** 3 * 100_000),
        createdAt,
        createdAt,
      ]);
    }
    await db.query(
      "INSERT INTO templates (slug, title, category_id, thumbnail_path, status, views, created_at, updated_at) VALUES ?",
      [rows]
    );
    process.stdout.write(`\r  ${Math.min(start + BATCH_SIZE, TOTAL_TEMPLATES)} / ${TOTAL_TEMPLATES}`);
  }

  console.log("\nDone.");
  await db.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
