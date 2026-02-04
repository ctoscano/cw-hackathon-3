/**
 * Model tier abstraction for provider-agnostic model selection.
 *
 * This module defines semantic model tiers that map to provider-specific models.
 * Use 'large' for complex tasks, 'small' for simple/fast tasks.
 */

/** Supported LLM providers */
export type LLMProvider = "claude-code" | "wandb-inference";

/**
 * Model tiers representing capability levels
 * - large: More capable, use for complex reasoning tasks
 * - small: Faster and cheaper, use for simple tasks
 */
export type ModelTier = "large" | "small";

/** Legacy model names for backward compatibility */
export type LegacyModel = "opus" | "sonnet" | "haiku";

/** Union of all supported model specifications */
export type ModelSpec = ModelTier | LegacyModel;

/**
 * Mapping from provider to tier to actual model name
 */
export const PROVIDER_MODEL_MAP: Record<LLMProvider, Record<ModelTier, string>> = {
  "claude-code": {
    large: "sonnet", // Claude 3.5 Sonnet - capable reasoning
    small: "haiku", // Claude 3 Haiku - fast and efficient
  },
  "wandb-inference": {
    large: "openai/gpt-oss-120b", // GPT OSS 120B - large model
    small: "openai/gpt-oss-20b", // GPT OSS 20B - smaller model
  },
};

/**
 * Map legacy Claude model names to model tiers
 */
export const LEGACY_TO_TIER: Record<LegacyModel, ModelTier> = {
  opus: "large", // Opus is the largest - map to large tier
  sonnet: "large", // Sonnet is capable - map to large tier
  haiku: "small", // Haiku is fast - map to small tier
};

/** Default model tier */
export const DEFAULT_MODEL_TIER: ModelTier = "large";

/** Default provider */
export const DEFAULT_PROVIDER: LLMProvider = "claude-code";

/**
 * Check if a model spec is a legacy model name
 */
export function isLegacyModel(model: ModelSpec): model is LegacyModel {
  return model === "opus" || model === "sonnet" || model === "haiku";
}

/**
 * Normalize a model specification to a model tier.
 * Handles both new tier names and legacy model names.
 */
export function normalizeToTier(model: ModelSpec | undefined): ModelTier {
  if (!model) {
    return DEFAULT_MODEL_TIER;
  }

  if (isLegacyModel(model)) {
    return LEGACY_TO_TIER[model];
  }

  return model;
}

/**
 * Get the actual model name for a provider and tier
 */
export function getModelName(provider: LLMProvider, tier: ModelTier): string {
  return PROVIDER_MODEL_MAP[provider][tier];
}

/**
 * Get the provider type from environment variable
 */
export function getProviderFromEnv(): LLMProvider {
  const provider = process.env.LLM_PROVIDER;
  if (provider === "wandb-inference") {
    return "wandb-inference";
  }
  return DEFAULT_PROVIDER;
}

/**
 * Resolve a model spec to the actual model name for the current provider
 */
export function resolveModelName(model: ModelSpec | undefined): {
  provider: LLMProvider;
  tier: ModelTier;
  modelName: string;
} {
  const provider = getProviderFromEnv();
  const tier = normalizeToTier(model);
  const modelName = getModelName(provider, tier);

  return { provider, tier, modelName };
}
