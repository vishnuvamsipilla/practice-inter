import Redis from "ioredis";

// Keep ONE connection for the whole process. In `next dev`, hot reload re-runs
// this module, so we stash the client on globalThis to avoid a new one per reload.
const g = globalThis as unknown as { __redis?: Redis };

export function getRedis(): Redis {
  if (!g.__redis) {
    g.__redis = new Redis(process.env.REDIS_URL!, {
      maxRetriesPerRequest: 2, // fail fast instead of hanging if Redis is down
    });
  }
  return g.__redis;
}
