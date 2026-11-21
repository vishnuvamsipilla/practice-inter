# Study Notes — Template Gallery

Running notes, one section per step. Read top to bottom before the interview.

## Big picture

```
Browser -> CDN -> Next.js -> Redis (cache) -> MySQL (source of truth)
                         \-> Redis counters (views) -> flush script -> MySQL
```

Rules of the architecture:
- **MySQL is the truth.** Redis only holds copies and counters.
- **Cache-aside:** read cache -> miss -> read DB -> write cache with a TTL.
- **Writes invalidate:** after changing MySQL, delete the affected cache keys.
- **CDN-friendly:** public GET responses carry `Cache-Control: s-maxage`.

---

## Step 1 — Fix the category route + Redis client

Files: `lib/redis.ts`, `app/api/categories/[slug]/route.ts`

### The 6 bugs in the original

| # | Bug | Why it hurts | Fix |
|---|-----|--------------|-----|
| 1 | `'${params.slug}'` in SQL | **SQL injection**: `/api/categories/x' OR '1'='1` | Parameterized query: `WHERE slug = ?`, `[slug]` |
| 2 | Cache key was constant `"category"` | `/resume` then `/invoice` returns resume (wrong data for everyone) | Key per slug: `category:${slug}` |
| 3 | `new Redis()` on every request | Connection leak; Redis runs out of connections | Singleton on `globalThis` |
| 4 | No TTL on `redis.set` | Stale data lives forever | `SET key value EX 300` |
| 5 | No 404 handling | Unknown slug -> `undefined` cached and returned | Return 404; cache `null` for 60s (negative caching) |
| 6 | No `Cache-Control` | CDN can't cache the response | `public, s-maxage=60, stale-while-revalidate=300` |

Extra: `SELECT *` -> select only the needed columns; Redis errors are caught so a Redis outage degrades to "slower" not "down".

### Concepts

- **Cache-aside**: app checks the cache first, loads from DB on a miss, then fills the cache.
- **TTL**: safety net so stale data eventually disappears even if invalidation is missed.
- **Negative caching**: cache "not found" briefly so attackers requesting random slugs don't all hit MySQL.
- **`s-maxage` vs `max-age`**: `s-maxage` applies to shared caches (CDN); `max-age` to the browser.
- **`stale-while-revalidate`**: CDN may serve a stale copy while fetching a fresh one in the background.
- **Singleton on `globalThis`**: in dev, Next hot-reloads modules, so a module-level variable would be recreated.

### Likely questions
- Why parameterized queries instead of escaping strings yourself?
- What happens if Redis goes down? (We catch and fall back to MySQL.)
- Why cache "not found"?
- What's the difference between `s-maxage` and `max-age`?
