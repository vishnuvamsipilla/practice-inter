import Redis from "ioredis";

// Keep ONE connection for the whole process. In `next dev`, hot reload re-runs
// this module, so we store the client on globalThis to survive reloads.
const g = globalThis as unknown as { __redis?: Redis };

export function getRedis(): Redis {
  if (!g.__redis) {
    g.__redis = new Redis(process.env.REDIS_URL!);
  }
  return g.__redis;
}
