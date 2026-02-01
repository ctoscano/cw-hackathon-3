import { generateObject, generateText } from "ai";
import { claudeCode } from "ai-sdk-provider-claude-code";
import type { z } from "zod";
import { initWeave, isWeaveEnabled, weave } from "./weave.js";

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
 * Core structured output generation - wrapped by Weave for tracing
 */
async function generateStructuredOutputCore<T>(params: {
  schema: z.ZodType<T>;
  prompt: string;
  system?: string;
  modelName: string;
}): Promise<{
  object: T;
  usage?: { inputTokens: number; outputTokens: number; totalTokens: number };
}> {
  const result = await generateObject({
    model: claudeCode(params.modelName as "opus" | "sonnet" | "haiku"),
    schema: params.schema,
    prompt: params.prompt,
    system: params.system,
  });
  return {
    object: result.object,
    usage: result.usage
      ? {
          inputTokens: result.usage.inputTokens ?? 0,
          outputTokens: result.usage.outputTokens ?? 0,
          totalTokens: result.usage.totalTokens ?? 0,
        }
      : undefined,
  };
}

// Create Weave-wrapped version of the core function
const generateStructuredOutputOp = weave.op(generateStructuredOutputCore, {
  name: "generateStructuredOutput",
});

/**
 * Generate structured output with telemetry tracking
 *
 * This is the primary function for generating typed responses from the LLM.
 * It wraps the AI SDK's generateObject with timing, token tracking, and error handling.
 *
 * Uses Claude Code as the AI provider - requires Claude Code CLI to be authenticated.
 * When WEAVE_PROJECT is set, calls are traced to Weights & Biases.
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

  // Initialize Weave if configured (lazy initialization)
  if (isWeaveEnabled()) {
    await initWeave();
  }

  const telemetry: AITelemetry = {
    startTime,
    endTime: startTime,
    durationMs: 0,
    model: modelName,
    success: false,
  };

  try {
    // Use Weave-wrapped version if enabled, otherwise call directly
    const callFn = isWeaveEnabled() ? generateStructuredOutputOp : generateStructuredOutputCore;
    const result = await callFn({
      schema,
      prompt,
      system,
      modelName,
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
 * Core text output generation - wrapped by Weave for tracing
 */
async function generateTextOutputCore(params: {
  prompt: string;
  system?: string;
  modelName: string;
}): Promise<{
  text: string;
  usage?: { inputTokens: number; outputTokens: number; totalTokens: number };
}> {
  const result = await generateText({
    model: claudeCode(params.modelName as "opus" | "sonnet" | "haiku"),
    prompt: params.prompt,
    system: params.system,
  });
  return {
    text: result.text,
    usage: result.usage
      ? {
          inputTokens: result.usage.inputTokens ?? 0,
          outputTokens: result.usage.outputTokens ?? 0,
          totalTokens: result.usage.totalTokens ?? 0,
        }
      : undefined,
  };
}

// Create Weave-wrapped version of the core function
const generateTextOutputOp = weave.op(generateTextOutputCore, {
  name: "generateTextOutput",
});

/**
 * Generate text output with telemetry tracking
 *
 * Used for cases where structured output isn't needed (e.g., synthetic generation)
 * When WEAVE_PROJECT is set, calls are traced to Weights & Biases.
 */
export async function generateTextOutput(options: {
  prompt: string;
  system?: string;
  config?: AIClientConfig;
}): Promise<AIResult<string>> {
  const { prompt, system, config } = options;
  const modelName = config?.model ?? DEFAULT_MODEL;
  const startTime = new Date();

  // Initialize Weave if configured (lazy initialization)
  if (isWeaveEnabled()) {
    await initWeave();
  }

  const telemetry: AITelemetry = {
    startTime,
    endTime: startTime,
    durationMs: 0,
    model: modelName,
    success: false,
  };

  try {
    // Use Weave-wrapped version if enabled, otherwise call directly
    const callFn = isWeaveEnabled() ? generateTextOutputOp : generateTextOutputCore;
    const result = await callFn({
      prompt,
      system,
      modelName,
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
