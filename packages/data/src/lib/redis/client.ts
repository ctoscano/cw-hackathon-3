/**
 * Redis client for CLI
 * Optimized for short-lived command execution
 */

import { type RedisClientType, createClient } from "redis";

/**
 * Create and connect Redis client for CLI usage
 * Designed for short-lived connections (connect/disconnect per command)
 */
export async function createRedisClient() {
  const host = process.env.REDIS_HOST;
  const port = process.env.REDIS_PORT;
  const password = process.env.REDIS_PASSWORD;

  if (!host || !port || !password) {
    throw new Error(
      "Redis configuration missing. Set REDIS_HOST, REDIS_PORT, and REDIS_PASSWORD environment variables.",
    );
  }

  const client = createClient({
    socket: {
      host,
      port: Number(port),
      connectTimeout: Number(process.env.REDIS_CONNECT_TIMEOUT) || 5000,
    },
    password,
  });

  // Error handler
  client.on("error", (err) => {
    console.error("Redis Client Error:", err);
  });

  await client.connect();
  return client as RedisClientType;
}

/**
 * Execute Redis operation with automatic connection/disconnection
 * Useful for CLI commands that need single operations
 */
export async function withRedisClient<T>(
  operation: (client: RedisClientType) => Promise<T>,
): Promise<T> {
  const client = await createRedisClient();
  try {
    return await operation(client);
  } finally {
    await client.quit();
  }
}

/**
 * Check if Redis is enabled (for optional persistence)
 */
export function isRedisEnabled(): boolean {
  return process.env.REDIS_ENABLED !== "false";
}
