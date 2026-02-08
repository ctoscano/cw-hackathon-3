"use server";

/**
 * Server Actions for intake persistence
 * Wraps Redis persistence functions for use in Client Components
 */

import {
  type SessionData,
  getSessionData as getSessionDataLib,
  saveContactInfo as saveContactInfoLib,
  saveIntakeCompletion as saveIntakeCompletionLib,
  saveIntakeProgress as saveIntakeProgressLib,
  trackChatGPTClick as trackChatGPTClickLib,
} from "@/lib/redis/intake";

/**
 * Server Action: Save intake progress after each question answered
 */
export async function saveIntakeProgress(
  sessionId: string,
  questionId: string,
  questionPrompt: string,
  answer: string | string[],
  reflection: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(
      `[Server Action] Saving intake progress for session ${sessionId}, question ${questionId}`,
    );

    await saveIntakeProgressLib(sessionId, questionId, questionPrompt, answer, reflection);

    console.log(`[Server Action] Successfully saved progress for ${sessionId}`);
    return { success: true };
  } catch (error) {
    console.error("[Server Action] Error saving intake progress:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Server Action: Save intake completion outputs
 */
export async function saveIntakeCompletion(
  sessionId: string,
  outputs: {
    personalizedBrief: string;
    firstSessionGuide: string;
    experiments: string[];
  },
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`[Server Action] Saving intake completion for session ${sessionId}`);

    await saveIntakeCompletionLib(sessionId, outputs);

    console.log(`[Server Action] Successfully saved completion for ${sessionId}`);
    return { success: true };
  } catch (error) {
    console.error("[Server Action] Error saving intake completion:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Server Action: Save contact information
 */
export async function saveContactInfo(
  sessionId: string,
  email?: string,
  phone?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`[Server Action] Saving contact info for session ${sessionId}`);

    await saveContactInfoLib(sessionId, email, phone);

    console.log(`[Server Action] Successfully saved contact info for ${sessionId}`);
    return { success: true };
  } catch (error) {
    console.error("[Server Action] Error saving contact info:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Server Action: Track ChatGPT button click
 */
export async function trackChatGPTClick(
  sessionId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const timestamp = new Date().toISOString();
    console.log(`[Server Action] Tracking ChatGPT click for session ${sessionId}`);

    await trackChatGPTClickLib(sessionId, timestamp);

    console.log(`[Server Action] Successfully tracked click for ${sessionId}`);
    return { success: true };
  } catch (error) {
    console.error("[Server Action] Error tracking ChatGPT click:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Server Action: Get complete session data
 */
export async function getSessionData(
  sessionId: string,
): Promise<{ success: boolean; data?: SessionData; error?: string }> {
  try {
    console.log(`[Server Action] Retrieving session data for ${sessionId}`);

    const data = await getSessionDataLib(sessionId);

    if (!data) {
      return { success: false, error: "Session not found" };
    }

    console.log(`[Server Action] Successfully retrieved session data for ${sessionId}`);
    return { success: true, data };
  } catch (error) {
    console.error("[Server Action] Error retrieving session data:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Generate a new session ID
 * Uses crypto.randomUUID() for client-side generation
 */
export async function generateSessionId(): Promise<string> {
  return crypto.randomUUID();
}
