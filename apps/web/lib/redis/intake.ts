/**
 * Intake persistence functions
 * Tracks questionnaire progress, completion, contact info, and interactions
 */

import { getRedisClient } from "./client";

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
 * Save intake progress after each question answered
 * Uses Redis List to maintain order
 */
export async function saveIntakeProgress(
  sessionId: string,
  questionId: string,
  questionPrompt: string,
  answer: string | string[],
  reflection: string,
): Promise<void> {
  const client = await getRedisClient();

  const entry: IntakeProgressEntry = {
    questionId,
    questionPrompt,
    answer,
    reflection,
    timestamp: new Date().toISOString(),
  };

  // Store progress entry in list
  const progressKey = `intake:${sessionId}:progress`;
  await client.rPush(progressKey, JSON.stringify(entry));

  // Update or create session metadata
  const metaKey = `intake:${sessionId}:meta`;
  const metaExists = await client.exists(metaKey);

  if (!metaExists) {
    await client.hSet(metaKey, {
      sessionId,
      intakeType: "therapy_readiness",
      createdAt: new Date().toISOString(),
    });
  }

  // Update lastUpdated timestamp
  await client.hSet(metaKey, "lastUpdated", new Date().toISOString());
}

/**
 * Get all progress entries for a session
 */
export async function getIntakeProgress(sessionId: string): Promise<IntakeProgressEntry[]> {
  const client = await getRedisClient();

  const progressKey = `intake:${sessionId}:progress`;
  const entries = await client.lRange(progressKey, 0, -1);

  return entries.map((entry) => JSON.parse(entry) as IntakeProgressEntry);
}

/**
 * Save intake completion outputs
 * Uses Redis Hash for structured data
 */
export async function saveIntakeCompletion(
  sessionId: string,
  outputs: {
    personalizedBrief: string;
    firstSessionGuide: string;
    experiments: string[];
  },
): Promise<void> {
  const client = await getRedisClient();

  const completion: IntakeCompletionData = {
    sessionId,
    timestamp: new Date().toISOString(),
    outputs,
  };

  // Store completion data
  const completionKey = `intake:${sessionId}:completion`;
  await client.hSet(completionKey, {
    sessionId: completion.sessionId,
    timestamp: completion.timestamp,
    personalizedBrief: completion.outputs.personalizedBrief,
    firstSessionGuide: completion.outputs.firstSessionGuide,
    experiments: JSON.stringify(completion.outputs.experiments),
  });

  // Update metadata with completion timestamp
  const metaKey = `intake:${sessionId}:meta`;
  await client.hSet(metaKey, "completedAt", new Date().toISOString());
}

/**
 * Save contact information (email/phone)
 * Stored separately but associated with session
 */
export async function saveContactInfo(
  sessionId: string,
  email?: string,
  phone?: string,
): Promise<void> {
  const client = await getRedisClient();

  const contact: ContactInfo = {
    sessionId,
    email,
    phone,
    timestamp: new Date().toISOString(),
  };

  const contactKey = `intake:${sessionId}:contact`;
  const fields: Record<string, string> = {
    sessionId: contact.sessionId,
    timestamp: contact.timestamp,
  };

  if (email) fields.email = email;
  if (phone) fields.phone = phone;

  await client.hSet(contactKey, fields);
}

/**
 * Track ChatGPT button click
 * Uses Redis List to maintain event order
 */
export async function trackChatGPTClick(sessionId: string, timestamp: string): Promise<void> {
  const client = await getRedisClient();

  const event: InteractionEvent = {
    type: "chatgpt_click",
    timestamp,
  };

  const interactionsKey = `intake:${sessionId}:interactions`;
  await client.rPush(interactionsKey, JSON.stringify(event));
}

/**
 * Get complete session data (all related data)
 */
export async function getSessionData(sessionId: string): Promise<SessionData | null> {
  const client = await getRedisClient();

  // Get metadata
  const metaKey = `intake:${sessionId}:meta`;
  const metaData = await client.hGetAll(metaKey);

  if (!metaData || Object.keys(metaData).length === 0) {
    return null; // Session doesn't exist
  }

  // Get progress
  const progress = await getIntakeProgress(sessionId);

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
}
