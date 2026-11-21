# Template Gallery — coding test

Welcome! In this test you build a small **Template Gallery app**, like a mini Template.net.
You have **30 minutes**. Any AI tool is allowed (Cursor, Claude, Copilot, ...).
After coding, you have **30 minutes** to demo the app and explain your code.

## Setup (please do this before the interview)

Needs Node.js 20 and Docker.

```bash
cp .env.example .env
docker compose up -d        # MySQL 8 + Redis 7
npm install
npm run seed                # 50,000 templates, 20 categories
npm run dev                 # http://localhost:3000
```

Check it works: open http://localhost:3000/api/categories/resume — you should see JSON.

If `npm run seed` fails right after `docker compose up`, wait 20 seconds for MySQL to start and run it again.

## What is in the repo

| Path | What it is |
| --- | --- |
| `db/schema.sql` | Tables: `categories`, `templates` |
| `scripts/seed.ts` | Fills the database with test data |
| `lib/db.ts` | MySQL pool (`mysql2`) |
| `lib/redis.ts` | Redis client (`ioredis`) |
| `lib/templates.ts` | Empty. Your data layer goes here |
| `app/api/categories/[slug]/route.ts` | One existing API route |
| `app/templates/` | Your pages go here |
| `app/admin/` | Your admin page goes here |
| `app/api/templates/` | Your API routes go here |
| `scripts/flush-views.ts` | Empty. Your view flush script goes here |

`thumbnail_path` is a path like `/seed/abc/600/800`. Full image URL = `CDN_BASE_URL + thumbnail_path`.
Locally `CDN_BASE_URL` is picsum.photos so images load. In production it is `https://cdn.template.net`.

## The task

You will get the full task brief at the start of the interview.
In short: build the gallery page, the detail page, view counting and a small admin edit page,
with MySQL as the source of truth, Redis cache, and responses that a CDN can cache.

## Rules

- Share your screen the whole time and think aloud.
- Use any AI tool, but you must be able to explain every line you keep.
- Simple, clean UI is enough. We do not score pixel-perfect design.
- Commit your work when the 30 minutes end.

Good luck!
