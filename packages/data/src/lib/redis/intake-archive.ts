/**
 * Intake archival functions for CLI
 * Retrieves intake sessions stored by the web app
 */

import type { RedisClientType } from "redis";
import { isRedisEnabled, withRedisClient } from "./client";

// Re-export for convenience
export { isRedisEnabled };

/**
 * Intake Progress Entry (single question/answer)
 */
export interface IntakeProgressEntry {
  questionId: string;
  questionPrompt: string;
  answer: string | string[];
  reflection: string;
  timestamp: string; // ISO 8601
}

/**
 * Intake Completion Data
 */
export interface IntakeCompletionData {
  sessionId: string;
  timestamp: string; // ISO 8601
  outputs: {
    personalizedBrief: string;
    firstSessionGuide: string;
    experiments: string[];
  };
}

/**
 * Contact Information
 */
export interface ContactInfo {
  sessionId: string;
  email?: string;
  phone?: string;
  timestamp: string; // ISO 8601
}

/**
 * Interaction Event
 */
export interface InteractionEvent {
  type: "chatgpt_click" | "other_future_events";
  timestamp: string; // ISO 8601
  metadata?: Record<string, unknown>;
}

/**
 * Complete Session Data (for retrieval)
 */
export interface SessionData {
  sessionId: string;
  progress: IntakeProgressEntry[];
  completion: IntakeCompletionData | null;
  contact: ContactInfo | null;
  interactions: InteractionEvent[];
  metadata: {
    intakeType: string;
    createdAt: string;
    completedAt?: string;
  };
}

/**
 * Session Summary (for list view)
 */
export interface SessionSummary {
  sessionId: string;
  intakeType: string;
  createdAt: string;
  completedAt?: string;
  lastUpdated?: string;
  progressCount: number;
  hasCompletion: boolean;
  hasContact: boolean;
  contactEmail?: string;
}

/**
 * Get all progress entries for a session
 */
async function getIntakeProgress(
  client: RedisClientType,
  sessionId: string,
): Promise<IntakeProgressEntry[]> {
  const progressKey = `intake:${sessionId}:progress`;
  const entries = await client.lRange(progressKey, 0, -1);

  return entries.map((entry) => JSON.parse(entry) as IntakeProgressEntry);
}

/**
 * Get complete session data (all related data)
 */
export async function getSessionData(sessionId: string): Promise<SessionData | null> {
  return await withRedisClient(async (client) => {
    // Get metadata
    const metaKey = `intake:${sessionId}:meta`;
    const metaData = await client.hGetAll(metaKey);

    if (!metaData || Object.keys(metaData).length === 0) {
      return null; // Session doesn't exist
    }

    // Get progress
    const progress = await getIntakeProgress(client, sessionId);

    // Get completion
    let completion: IntakeCompletionData | null = null;
    const completionKey = `intake:${sessionId}:completion`;
    const completionData = await client.hGetAll(completionKey);
    if (completionData && Object.keys(completionData).length > 0) {
      completion = {
        sessionId: completionData.sessionId,
        timestamp: completionData.timestamp,
        outputs: {
          personalizedBrief: completionData.personalizedBrief,
          firstSessionGuide: completionData.firstSessionGuide,
          experiments: JSON.parse(completionData.experiments),
        },
      };
    }

    // Get contact
    let contact: ContactInfo | null = null;
    const contactKey = `intake:${sessionId}:contact`;
    const contactData = await client.hGetAll(contactKey);
    if (contactData && Object.keys(contactData).length > 0) {
      contact = {
        sessionId: contactData.sessionId,
        email: contactData.email,
        phone: contactData.phone,
        timestamp: contactData.timestamp,
      };
    }

    // Get interactions
    const interactionsKey = `intake:${sessionId}:interactions`;
    const interactionEntries = await client.lRange(interactionsKey, 0, -1);
    const interactions = interactionEntries.map((entry) => JSON.parse(entry) as InteractionEvent);

    return {
      sessionId,
      progress,
      completion,
      contact,
      interactions,
      metadata: {
        intakeType: metaData.intakeType,
        createdAt: metaData.createdAt,
        completedAt: metaData.completedAt,
      },
    };
  });
}

/**
 * List intake sessions with pagination
 */
export async function listIntakeSessions(options: {
  limit?: number;
  offset?: number;
  search?: string;
}): Promise<SessionSummary[]> {
  return await withRedisClient(async (client) => {
    const { limit = 20, offset = 0, search } = options;

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

    // Sort by creation time (newest first)
    // We'll need to fetch metadata for sorting
    const sessionDataPromises = keys.map(async (key) => {
      const sessionId = key.replace("intake:", "").replace(":meta", "");
      const metaData = await client.hGetAll(key);
      const progressKey = `intake:${sessionId}:progress`;
      const completionKey = `intake:${sessionId}:completion`;
      const contactKey = `intake:${sessionId}:contact`;

      const [progressCount, hasCompletion, contactData] = await Promise.all([
        client.lLen(progressKey),
        client.exists(completionKey),
        client.hGetAll(contactKey),
      ]);

      return {
        sessionId,
        intakeType: metaData.intakeType || "unknown",
        createdAt: metaData.createdAt,
        completedAt: metaData.completedAt,
        lastUpdated: metaData.lastUpdated,
        progressCount,
        hasCompletion: hasCompletion === 1,
        hasContact: Object.keys(contactData).length > 0,
        contactEmail: contactData.email,
      };
    });

    const sessions = await Promise.all(sessionDataPromises);

    // Sort by createdAt (newest first)
    sessions.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Apply pagination
    return sessions.slice(offset, offset + limit);
  });
}

/**
 * Get count of intake sessions
 */
export async function getIntakeSessionCount(): Promise<number> {
  return await withRedisClient(async (client) => {
    const keys: string[] = [];
    // Redis SCAN returns cursor as number, convert to string for next call
    let cursor: string | number = 0;

    do {
      const cursorArg = typeof cursor === "number" ? cursor.toString() : cursor;
      const result = await client.scan(cursorArg, {
        MATCH: "intake:*:meta",
        COUNT: 100,
      });
      cursor = result.cursor;
      keys.push(...result.keys);
    } while (Number(cursor) !== 0);

    return keys.length;
  });
}
