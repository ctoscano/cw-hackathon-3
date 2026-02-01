import { generateObject, generateText } from "ai";
import { claudeCode } from "ai-sdk-provider-claude-code";
import type { z } from "zod";

/**
 * Telemetry data collected during AI calls
 */
export interface AITelemetry {
  startTime: Date;
  endTime: Date;
  durationMs: number;
  model: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  success: boolean;
  error?: string;
}

/**
 * Result wrapper that includes telemetry
 */
export interface AIResult<T> {
  data: T;
  telemetry: AITelemetry;
}

/**
 * Configuration for AI client
 */
export interface AIClientConfig {
  /** Model to use: 'opus', 'sonnet', or 'haiku' */
  model?: "opus" | "sonnet" | "haiku";
}

/** Default model for AI calls */
const DEFAULT_MODEL: "opus" | "sonnet" | "haiku" = "sonnet";

/**
 * Generate structured output with telemetry tracking
 *
 * This is the primary function for generating typed responses from the LLM.
 * It wraps the AI SDK's generateObject with timing, token tracking, and error handling.
 *
 * Uses Claude Code as the AI provider - requires Claude Code CLI to be authenticated.
 */
export async function generateStructuredOutput<T>(options: {
  schema: z.ZodType<T>;
  prompt: string;
  system?: string;
  config?: AIClientConfig;
}): Promise<AIResult<T>> {
  const { schema, prompt, system, config } = options;
  const modelName = config?.model ?? DEFAULT_MODEL;
  const startTime = new Date();

  const telemetry: AITelemetry = {
    startTime,
    endTime: startTime,
    durationMs: 0,
    model: modelName,
    success: false,
  };

  try {
    const result = await generateObject({
      model: claudeCode(modelName),
      schema,
      prompt,
      system,
    });

    const endTime = new Date();
    telemetry.endTime = endTime;
    telemetry.durationMs = endTime.getTime() - startTime.getTime();
    telemetry.success = true;

    // Extract token usage if available (AI SDK v6 uses inputTokens/outputTokens)
    if (result.usage) {
      telemetry.promptTokens = result.usage.inputTokens;
      telemetry.completionTokens = result.usage.outputTokens;
      telemetry.totalTokens = result.usage.totalTokens;
    }

    console.log(
      `[AI] Generated structured output in ${telemetry.durationMs}ms (${telemetry.totalTokens ?? "?"} tokens)`,
    );

    return {
      data: result.object,
      telemetry,
    };
  } catch (error) {
    const endTime = new Date();
    telemetry.endTime = endTime;
    telemetry.durationMs = endTime.getTime() - startTime.getTime();
    telemetry.success = false;
    telemetry.error = error instanceof Error ? error.message : String(error);

    console.error(`[AI] Error after ${telemetry.durationMs}ms:`, telemetry.error);

    throw error;
  }
}

/**
 * Generate text output with telemetry tracking
 *
 * Used for cases where structured output isn't needed (e.g., synthetic generation)
 */
export async function generateTextOutput(options: {
  prompt: string;
  system?: string;
  config?: AIClientConfig;
}): Promise<AIResult<string>> {
  const { prompt, system, config } = options;
  const modelName = config?.model ?? DEFAULT_MODEL;
  const startTime = new Date();

  const telemetry: AITelemetry = {
    startTime,
    endTime: startTime,
    durationMs: 0,
    model: modelName,
    success: false,
  };

  try {
    const result = await generateText({
      model: claudeCode(modelName),
      prompt,
      system,
    });

    const endTime = new Date();
    telemetry.endTime = endTime;
    telemetry.durationMs = endTime.getTime() - startTime.getTime();
    telemetry.success = true;

    // Extract token usage if available (AI SDK v6 uses inputTokens/outputTokens)
    if (result.usage) {
      telemetry.promptTokens = result.usage.inputTokens;
      telemetry.completionTokens = result.usage.outputTokens;
      telemetry.totalTokens = result.usage.totalTokens;
    }

    console.log(
      `[AI] Generated text in ${telemetry.durationMs}ms (${telemetry.totalTokens ?? "?"} tokens)`,
    );

    return {
      data: result.text,
      telemetry,
    };
  } catch (error) {
    const endTime = new Date();
    telemetry.endTime = endTime;
    telemetry.durationMs = endTime.getTime() - startTime.getTime();
    telemetry.success = false;
    telemetry.error = error instanceof Error ? error.message : String(error);

    console.error(`[AI] Error after ${telemetry.durationMs}ms:`, telemetry.error);

    throw error;
  }
}

/**
 * Format telemetry for display or logging
 */
export function formatTelemetry(telemetry: AITelemetry): string {
  const lines = [
    `Model: ${telemetry.model}`,
    `Duration: ${telemetry.durationMs}ms`,
    `Status: ${telemetry.success ? "Success" : "Failed"}`,
  ];

  if (telemetry.totalTokens) {
    lines.push(
      `Tokens: ${telemetry.promptTokens} prompt + ${telemetry.completionTokens} completion = ${telemetry.totalTokens} total`,
    );
  }

  if (telemetry.error) {
    lines.push(`Error: ${telemetry.error}`);
  }

  return lines.join("\n");
}
