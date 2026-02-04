/**
 * Redis client singleton for web app
 * Provides connection to Redis Cloud for data persistence
 */

import { createClient } from "redis";
import type { RedisClientType } from "redis";

let client: RedisClientType | null = null;
let connecting: Promise<RedisClientType> | null = null;

/**
 * Get or create Redis client singleton
 * Handles connection pooling and reconnection logic
 */
export async function getRedisClient(): Promise<RedisClientType> {
  // Return existing connected client
  if (client?.isOpen) {
    return client;
  }

  // Wait for existing connection attempt
  if (connecting) {
    return connecting;
  }

  // Start new connection
  connecting = connectRedis();
  try {
    client = await connecting;
    return client;
  } finally {
    connecting = null;
  }
}

/**
 * Internal function to create and connect Redis client
 */
async function connectRedis() {
  const host = process.env.REDIS_HOST;
  const port = process.env.REDIS_PORT;
  const password = process.env.REDIS_PASSWORD;

  if (!host || !port || !password) {
    throw new Error(
      "Redis configuration missing. Set REDIS_HOST, REDIS_PORT, and REDIS_PASSWORD environment variables.",
    );
  }

  const newClient = createClient({
    socket: {
      host,
      port: Number(port),
      connectTimeout: Number(process.env.REDIS_CONNECT_TIMEOUT) || 5000,
    },
    password,
  });

  // Error handler
  newClient.on("error", (err) => {
    console.error("Redis Client Error:", err);
  });

  // Reconnection handler
  newClient.on("reconnecting", () => {
    console.log("Redis Client reconnecting...");
  });

  // Ready handler
  newClient.on("ready", () => {
    console.log("Redis Client connected successfully");
  });

  await newClient.connect();
  return newClient as RedisClientType;
}

/**
 * Close Redis connection (for cleanup)
 */
export async function closeRedisClient(): Promise<void> {
  if (client?.isOpen) {
    await client.quit();
    client = null;
  }
}

/**
 * Check if Redis is enabled (for optional persistence)
 */
export function isRedisEnabled(): boolean {
  return process.env.REDIS_ENABLED !== "false";
}
