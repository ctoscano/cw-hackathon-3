/**
 * Ops-specific Redis query functions
 * Optimized for the /ops dashboard interface
 */

import { getRedisClient } from "./client";
import type { SessionData } from "./intake";

/**
 * Session Summary for list views
 */
export interface SessionSummary {
  id: string;
  type: "intake" | "dap";
  createdAt: string;
  completedAt?: string;
  email?: string;
  status: "complete" | "in_progress";
  metadata?: Record<string, string>;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * List archived intake sessions with pagination and search
 */
export async function listArchivedIntakeSessions(
  page = 1,
  pageSize = 20,
  search?: string,
): Promise<PaginatedResponse<SessionSummary>> {
  const client = await getRedisClient();

  // Scan for intake session metadata keys
  const pattern = search ? `intake:*${search}*:meta` : "intake:*:meta";
  const keys: string[] = [];

  // Use SCAN to find all matching keys
  // Redis SCAN returns cursor as number, convert to string for next call
  let cursor: string | number = 0;
  do {
    const cursorArg = typeof cursor === "number" ? cursor.toString() : cursor;
    const result = await client.scan(cursorArg, {
      MATCH: pattern,
      COUNT: 100,
    });
    cursor = result.cursor;
    keys.push(...result.keys);
  } while (Number(cursor) !== 0);

  // Fetch metadata for each session
  const sessionDataPromises = keys.map(async (key) => {
    const sessionId = key.replace("intake:", "").replace(":meta", "");
    const metaData = await client.hGetAll(key);
    const completionKey = `intake:${sessionId}:completion`;
    const contactKey = `intake:${sessionId}:contact`;

    const [hasCompletion, contactData] = await Promise.all([
      client.exists(completionKey),
      client.hGetAll(contactKey),
    ]);

    const status: "complete" | "in_progress" = hasCompletion === 1 ? "complete" : "in_progress";

    return {
      id: sessionId,
      type: "intake" as const,
      createdAt: metaData.createdAt,
      completedAt: metaData.completedAt,
      email: contactData.email,
      status,
      metadata: {
        intakeType: metaData.intakeType,
        lastUpdated: metaData.lastUpdated,
      },
    };
  });

  const sessions = await Promise.all(sessionDataPromises);

  // Sort by createdAt (newest first)
  sessions.sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Calculate pagination
  const total = sessions.length;
  const totalPages = Math.ceil(total / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const items = sessions.slice(startIndex, endIndex);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages,
  };
}

/**
 * DAP Archive Entry structure (matching CLI)
 */
export interface DAPArchiveEntry {
  sessionId: string;
  timestamp: string;
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
 * List archived DAP sessions with pagination
 */
export async function listArchivedDAPSessions(
  page = 1,
  pageSize = 20,
): Promise<PaginatedResponse<SessionSummary>> {
  const client = await getRedisClient();

  // Get session IDs from recent list (reverse order - newest first)
  const allSessionIds = await client.zRange("dap:recent", 0, -1, { REV: true });

  // Calculate pagination
  const total = allSessionIds.length;
  const totalPages = Math.ceil(total / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const sessionIds = allSessionIds.slice(startIndex, endIndex);

  // Fetch each DAP output
  const sessionDataPromises = sessionIds.map(async (sessionId) => {
    const key = `dap:${sessionId}`;
    const data = await client.hGetAll(key);

    if (!data || Object.keys(data).length === 0) {
      return null;
    }

    const metadata = JSON.parse(data.metadata || "{}");

    return {
      id: sessionId,
      type: "dap" as const,
      createdAt: data.timestamp,
      completedAt: data.timestamp, // DAP is always complete when archived
      status: "complete" as const,
      metadata: {
        intakeType: data.intakeType,
        model: metadata.model,
        tokensUsed: metadata.tokensUsed?.toString(),
        generationTimeMs: metadata.generationTimeMs?.toString(),
      },
    };
  });

  const sessionsWithNulls = await Promise.all(sessionDataPromises);
  const sessions = sessionsWithNulls.filter((s) => s !== null) as SessionSummary[];

  return {
    items: sessions,
    total,
    page,
    pageSize,
    totalPages,
  };
}

/**
 * Get full DAP session details
 */
export async function getDAPSession(sessionId: string): Promise<DAPArchiveEntry | null> {
  const client = await getRedisClient();

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
 * Stats data structure
 */
export interface StatsData {
  totalIntakeSessions: number;
  completedIntakeSessions: number;
  inProgressIntakeSessions: number;
  totalDAPSessions: number;
}

/**
 * Get dashboard statistics
 */
export async function getDashboardStats(): Promise<StatsData> {
  const client = await getRedisClient();

  try {
    // Count intake sessions by scanning for meta keys
    const intakeKeys: string[] = [];
    let cursor: string | number = 0;
    do {
      const cursorArg = typeof cursor === "number" ? cursor.toString() : cursor;
      const result = await client.scan(cursorArg, {
        MATCH: "intake:*:meta",
        COUNT: 100,
      });
      cursor = result.cursor;
      intakeKeys.push(...result.keys);
    } while (Number(cursor) !== 0);

    const totalIntakeSessions = intakeKeys.length;

    // Count completed sessions by checking for completion keys
    const completionCheckPromises = intakeKeys.map((key) => {
      const sessionId = key.replace("intake:", "").replace(":meta", "");
      return client.exists(`intake:${sessionId}:completion`);
    });
    const completionResults = await Promise.all(completionCheckPromises);
    const completedIntakeSessions = completionResults.filter((exists) => exists === 1).length;

    const inProgressIntakeSessions = totalIntakeSessions - completedIntakeSessions;

    // Count DAP sessions using the recent list
    const totalDAPSessions = await client.zCard("dap:recent");

    return {
      totalIntakeSessions,
      completedIntakeSessions,
      inProgressIntakeSessions,
      totalDAPSessions,
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    // Return zeros if there's an error
    return {
      totalIntakeSessions: 0,
      completedIntakeSessions: 0,
      inProgressIntakeSessions: 0,
      totalDAPSessions: 0,
    };
  }
}
