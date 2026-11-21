import Redis from "ioredis";

export function getRedis() {
  return new Redis(process.env.REDIS_URL!);
}
