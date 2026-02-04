/**
 * DAP archival functions for CLI
 * Stores and retrieves DAP outputs with metadata
 */

import { createRedisClient, withRedisClient, isRedisEnabled } from "./client.js";
import type { RedisClientType } from "redis";

// Re-export for convenience
export { isRedisEnabled };

/**
 * DAP Archive Entry structure
 */
export interface DAPArchiveEntry {
  sessionId: string;
  timestamp: string; // ISO 8601
  intakeType: string;
  dap: {
    disclosure: string;
    assessment: string;
    plan: string;
  };
  metadata: {
    model?: string;
    tokensUsed?: number;
    generationTimeMs?: number;
  };
}

/**
 * Archive a DAP output to Redis (CLI version)
 * Uses withRedisClient for automatic connection management
 */
export async function archiveDAPOutput(
  sessionId: string,
  dap: { disclosure: string; assessment: string; plan: string },
  metadata: { model?: string; tokensUsed?: number; generationTimeMs?: number } = {},
): Promise<void> {
  await withRedisClient(async (client) => {
    const entry: DAPArchiveEntry = {
      sessionId,
      timestamp: new Date().toISOString(),
      intakeType: "therapy_readiness", // Default for now
      dap,
      metadata,
    };

    // Store as JSON string in Redis Hash
    const key = `dap:${sessionId}`;
    await client.hSet(key, {
      sessionId: entry.sessionId,
      timestamp: entry.timestamp,
      intakeType: entry.intakeType,
      dap: JSON.stringify(entry.dap),
      metadata: JSON.stringify(entry.metadata),
    });

    // Add to recent DAP list (sorted set by timestamp)
    const score = Date.now();
    await client.zAdd("dap:recent", { score, value: sessionId });

    // Keep only last 100 in recent list
    await client.zRemRangeByRank("dap:recent", 0, -101);
  });
}

/**
 * Retrieve a DAP output by session ID (CLI version)
 */
export async function getDAPOutput(sessionId: string): Promise<DAPArchiveEntry | null> {
  return await withRedisClient(async (client) => {
    const key = `dap:${sessionId}`;
    const data = await client.hGetAll(key);

    if (!data || Object.keys(data).length === 0) {
      return null;
    }

    return {
      sessionId: data.sessionId,
      timestamp: data.timestamp,
      intakeType: data.intakeType,
      dap: JSON.parse(data.dap),
      metadata: JSON.parse(data.metadata),
    };
  });
}

/**
 * List DAP outputs with pagination (CLI version)
 */
export async function listDAPOutputs(options: {
  limit?: number;
  offset?: number;
}): Promise<DAPArchiveEntry[]> {
  return await withRedisClient(async (client) => {
    const { limit = 20, offset = 0 } = options;

    // Get session IDs from recent list (reverse order - newest first)
    const sessionIds = await client.zRange("dap:recent", -(offset + limit), -(offset + 1));

    // Fetch each DAP output
    const outputs = await Promise.all(
      sessionIds.map((sessionId) => getDAPOutputInternal(client, sessionId)),
    );

    // Filter out nulls
    return outputs.filter((output): output is DAPArchiveEntry => output !== null);
  });
}

/**
 * Internal helper to get DAP output with existing client
 */
async function getDAPOutputInternal(
  client: RedisClientType,
  sessionId: string,
): Promise<DAPArchiveEntry | null> {
  const key = `dap:${sessionId}`;
  const data = await client.hGetAll(key);

  if (!data || Object.keys(data).length === 0) {
    return null;
  }

  return {
    sessionId: data.sessionId,
    timestamp: data.timestamp,
    intakeType: data.intakeType,
    dap: JSON.parse(data.dap),
    metadata: JSON.parse(data.metadata),
  };
}

/**
 * Get count of archived DAP outputs (CLI version)
 */
export async function getDAPCount(): Promise<number> {
  return await withRedisClient(async (client) => {
    return await client.zCard("dap:recent");
  });
}
