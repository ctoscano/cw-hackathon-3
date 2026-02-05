import { generateObject, generateText } from "ai";
import type { z } from "zod";
import type { LLMProvider, ModelSpec } from "./models.js";
import { createModel } from "./providers/index.js";
import { initWeave, isWeaveEnabled, weave } from "./weave.js";

/**
 * Telemetry data collected during AI calls
 */
export interface AITelemetry {
  startTime: Date;
  endTime: Date;
  durationMs: number;
  /** The actual model name used by the provider */
  model: string;
  /** The provider used for this call */
  provider: LLMProvider;
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
 *
 * Supports both new model tiers ('large', 'small') and legacy model names ('opus', 'sonnet', 'haiku').
 * The actual model used depends on the LLM_PROVIDER environment variable.
 */
export interface AIClientConfig {
  /**
   * Model to use.
   *
   * New tier system:
   * - 'large': More capable model (sonnet/gpt-oss-120b)
   * - 'small': Faster model (haiku/gpt-oss-20b)
   *
   * Legacy (backward compatible):
   * - 'opus': Maps to 'large' tier
   * - 'sonnet': Maps to 'large' tier
   * - 'haiku': Maps to 'small' tier
   */
  model?: ModelSpec;
}

/**
 * Core structured output generation - wrapped by Weave for tracing
 */
async function generateStructuredOutputCore<T>(params: {
  schema: z.ZodType<T>;
  prompt: string;
  system?: string;
  modelSpec: ModelSpec | undefined;
}): Promise<{
  object: T;
  provider: LLMProvider;
  modelName: string;
  usage?: { inputTokens: number; outputTokens: number; totalTokens: number };
}> {
  const { model, provider, modelName } = createModel(params.modelSpec);

  const result = await generateObject({
    model,
    schema: params.schema,
    prompt: params.prompt,
    system: params.system,
  });
  return {
    object: result.object,
    provider,
    modelName,
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
 * The provider is selected via the LLM_PROVIDER environment variable:
 * - 'claude-code' (default): Uses Claude Code CLI authentication
 * - 'wandb-inference': Uses W&B Inference API (requires WANDB_API_KEY)
 *
 * When WEAVE_PROJECT is set, calls are traced to Weights & Biases.
 */
export async function generateStructuredOutput<T>(options: {
  schema: z.ZodType<T>;
  prompt: string;
  system?: string;
  config?: AIClientConfig;
}): Promise<AIResult<T>> {
  const { schema, prompt, system, config } = options;
  const modelSpec = config?.model;
  const startTime = new Date();

  // Initialize Weave if configured (lazy initialization)
  if (isWeaveEnabled()) {
    await initWeave();
  }

  const telemetry: AITelemetry = {
    startTime,
    endTime: startTime,
    durationMs: 0,
    model: "pending", // Will be set after provider resolves
    provider: "claude-code", // Will be set after provider resolves
    success: false,
  };

  try {
    // Use Weave-wrapped version if enabled, otherwise call directly
    const callFn = isWeaveEnabled() ? generateStructuredOutputOp : generateStructuredOutputCore;
    const result = await callFn({
      schema,
      prompt,
      system,
      modelSpec,
    });

    const endTime = new Date();
    telemetry.endTime = endTime;
    telemetry.durationMs = endTime.getTime() - startTime.getTime();
    telemetry.success = true;
    telemetry.model = result.modelName;
    telemetry.provider = result.provider;

    // Extract token usage if available (AI SDK v6 uses inputTokens/outputTokens)
    if (result.usage) {
      telemetry.promptTokens = result.usage.inputTokens;
      telemetry.completionTokens = result.usage.outputTokens;
      telemetry.totalTokens = result.usage.totalTokens;
    }

    console.log(
      `[AI] Generated structured output via ${telemetry.provider}/${telemetry.model} in ${telemetry.durationMs}ms (${telemetry.totalTokens ?? "?"} tokens)`,
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
  modelSpec: ModelSpec | undefined;
}): Promise<{
  text: string;
  provider: LLMProvider;
  modelName: string;
  usage?: { inputTokens: number; outputTokens: number; totalTokens: number };
}> {
  const { model, provider, modelName } = createModel(params.modelSpec);

  const result = await generateText({
    model,
    prompt: params.prompt,
    system: params.system,
  });
  return {
    text: result.text,
    provider,
    modelName,
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
 *
 * The provider is selected via the LLM_PROVIDER environment variable:
 * - 'claude-code' (default): Uses Claude Code CLI authentication
 * - 'wandb-inference': Uses W&B Inference API (requires WANDB_API_KEY)
 *
 * When WEAVE_PROJECT is set, calls are traced to Weights & Biases.
 */
export async function generateTextOutput(options: {
  prompt: string;
  system?: string;
  config?: AIClientConfig;
}): Promise<AIResult<string>> {
  const { prompt, system, config } = options;
  const modelSpec = config?.model;
  const startTime = new Date();

  // Initialize Weave if configured (lazy initialization)
  if (isWeaveEnabled()) {
    await initWeave();
  }

  const telemetry: AITelemetry = {
    startTime,
    endTime: startTime,
    durationMs: 0,
    model: "pending", // Will be set after provider resolves
    provider: "claude-code", // Will be set after provider resolves
    success: false,
  };

  try {
    // Use Weave-wrapped version if enabled, otherwise call directly
    const callFn = isWeaveEnabled() ? generateTextOutputOp : generateTextOutputCore;
    const result = await callFn({
      prompt,
      system,
      modelSpec,
    });

    const endTime = new Date();
    telemetry.endTime = endTime;
    telemetry.durationMs = endTime.getTime() - startTime.getTime();
    telemetry.success = true;
    telemetry.model = result.modelName;
    telemetry.provider = result.provider;

    // Extract token usage if available (AI SDK v6 uses inputTokens/outputTokens)
    if (result.usage) {
      telemetry.promptTokens = result.usage.inputTokens;
      telemetry.completionTokens = result.usage.outputTokens;
      telemetry.totalTokens = result.usage.totalTokens;
    }

    console.log(
      `[AI] Generated text via ${telemetry.provider}/${telemetry.model} in ${telemetry.durationMs}ms (${telemetry.totalTokens ?? "?"} tokens)`,
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
    `Provider: ${telemetry.provider}`,
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
