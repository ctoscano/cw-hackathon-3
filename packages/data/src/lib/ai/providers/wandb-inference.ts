/**
 * Weights & Biases Inference provider for the Vercel AI SDK.
 *
 * W&B Inference provides an OpenAI-compatible API endpoint.
 * This provider configures the OpenAI SDK to use the W&B Inference endpoint.
 *
 * Available models:
 * - openai/gpt-oss-120b: Large model for complex tasks
 * - openai/gpt-oss-20b: Smaller model for simple tasks
 *
 * Environment variables:
 * - WANDB_API_KEY: Required for authentication
 * - WEAVE_PROJECT: Optional project identifier for usage tracking
 */

import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

/** W&B Inference API base URL */
const WANDB_INFERENCE_BASE_URL = "https://api.inference.wandb.ai/v1";

/** W&B Inference model names */
export type WandBInferenceModel = "openai/gpt-oss-120b" | "openai/gpt-oss-20b";

/**
 * Get the project identifier for W&B tracking.
 * Looks for WEAVE_PROJECT, WANDB_PROJECT, or CORE_WEAVE environment variables.
 */
function getWandBProject(): string | undefined {
  return process.env.WEAVE_PROJECT || process.env.WANDB_PROJECT || process.env.CORE_WEAVE;
}

/**
 * Create a W&B Inference OpenAI provider instance.
 * This creates a configured OpenAI provider that points to the W&B Inference endpoint.
 */
function createWandBInferenceProvider() {
  const apiKey = process.env.WANDB_API_KEY;
  if (!apiKey) {
    throw new Error("WANDB_API_KEY environment variable is required for W&B Inference provider");
  }

  const project = getWandBProject();

  return createOpenAI({
    baseURL: WANDB_INFERENCE_BASE_URL,
    apiKey,
    // Pass the project as a custom header for usage tracking
    headers: project
      ? {
          "OpenAI-Project": project,
        }
      : undefined,
  });
}

/** Cached provider instance */
let cachedProvider: ReturnType<typeof createOpenAI> | null = null;

/**
 * Get or create the W&B Inference provider (singleton pattern).
 */
function getProvider() {
  if (!cachedProvider) {
    cachedProvider = createWandBInferenceProvider();
  }
  return cachedProvider;
}

/**
 * Create a W&B Inference language model instance.
 *
 * @param modelName - The model name: 'openai/gpt-oss-120b' or 'openai/gpt-oss-20b'
 * @returns A Vercel AI SDK compatible language model
 */
export function createWandBInferenceModel(modelName: string): LanguageModel {
  const provider = getProvider();
  return provider(modelName);
}

/**
 * Clear the cached provider (useful for testing or reconfiguration)
 */
export function clearProviderCache(): void {
  cachedProvider = null;
}
