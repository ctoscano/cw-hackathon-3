/**
 * LLM Provider Factory
 *
 * This module provides a unified interface for creating language models
 * from different providers (Claude Code, W&B Inference).
 *
 * The provider is selected via the LLM_PROVIDER environment variable.
 */

import type { LanguageModel } from "ai";
import {
  type LLMProvider,
  type ModelSpec,
  getProviderFromEnv,
  resolveModelName,
} from "../models.js";
import { createClaudeCodeModel } from "./claude-code.js";
import { createWandBInferenceModel } from "./wandb-inference.js";

/**
 * Create a language model for the given model specification.
 *
 * This factory function:
 * 1. Determines the active provider from environment
 * 2. Resolves the model spec to a provider-specific model name
 * 3. Creates and returns the appropriate language model
 *
 * @param model - Model specification (tier like 'large'/'small' or legacy name like 'sonnet')
 * @returns A Vercel AI SDK compatible language model
 */
export function createModel(model: ModelSpec | undefined): {
  model: LanguageModel;
  provider: LLMProvider;
  modelName: string;
} {
  const { provider, modelName } = resolveModelName(model);

  let languageModel: LanguageModel;

  switch (provider) {
    case "wandb-inference":
      languageModel = createWandBInferenceModel(modelName);
      break;
    default:
      languageModel = createClaudeCodeModel(modelName);
      break;
  }

  return {
    model: languageModel,
    provider,
    modelName,
  };
}

/**
 * Get information about the currently configured provider.
 */
export function getProviderInfo(): {
  provider: LLMProvider;
  description: string;
} {
  const provider = getProviderFromEnv();

  const descriptions: Record<LLMProvider, string> = {
    "claude-code": "Claude Code (Anthropic via CLI)",
    "wandb-inference": "Weights & Biases Inference (OpenAI API)",
  };

  return {
    provider,
    description: descriptions[provider],
  };
}

// Re-export for convenience
export { createClaudeCodeModel } from "./claude-code.js";
export { createWandBInferenceModel, clearProviderCache } from "./wandb-inference.js";
