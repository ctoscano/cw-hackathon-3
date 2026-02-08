/**
 * Get the most recent intake session ID from Redis
 * Usage: bun run src/scripts/get-latest-session.ts [minTimestamp]
 */

import { createRedisClient } from "../lib/redis/client.js";

const minTimestamp = process.argv[2] ? Number.parseInt(process.argv[2]) : 0;

const redis = await createRedisClient();

try {
  const keys = await redis.keys("intake:*:meta");

  let latestSessionId: string | null = null;
  let latestTimestamp = minTimestamp;

  for (const key of keys) {
    const data = await redis.hGetAll(key);
    const createdAt = new Date(data.createdAt).getTime();

    if (createdAt >= minTimestamp && createdAt > latestTimestamp) {
      latestTimestamp = createdAt;
      latestSessionId = key.split(":")[1];
    }
  }

  if (latestSessionId) {
    console.log(latestSessionId);
    process.exit(0);
  } else {
    console.error("No session found");
    process.exit(1);
  }
} finally {
  await redis.quit();
}
