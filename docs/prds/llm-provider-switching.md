# PRD: LLM Provider Switching

## Overview

Add the ability to switch between Claude Code (via Anthropic) and Weights & Biases Inference as LLM providers. This enables cost optimization and flexibility in model selection while maintaining the existing telemetry and tracing infrastructure.

## Background

### Current State
- Uses Vercel AI SDK (`ai` v6.0.0) with Claude Code provider
- Supports models: `opus`, `sonnet`, `haiku` (Claude 3 family)
- Has Weave tracing integration for observability
- Two main functions: `generateStructuredOutput<T>()` and `generateTextOutput()`

### W&B Inference API
W&B Inference provides an OpenAI-compatible API endpoint:
- Base URL: `https://api.inference.wandb.ai/v1`
- Authentication: Bearer token via `WANDB_API_KEY`
- Project tracking: `OpenAI-Project` header
- Available models:
  - `openai/gpt-oss-120b` - Larger, more capable model
  - `openai/gpt-oss-20b` - Smaller, faster model

## Goals

1. **Provider Abstraction**: Create a clean abstraction layer that supports multiple LLM providers
2. **Seamless Switching**: Switch providers via environment variable without code changes
3. **Model Mapping**: Map semantic model tiers (large/small) to provider-specific models
4. **Backward Compatibility**: Maintain existing API (`generateStructuredOutput`, `generateTextOutput`)
5. **Telemetry Preservation**: Keep existing telemetry and Weave tracing working

## Non-Goals

- Supporting additional providers beyond Claude Code and W&B Inference
- Implementing streaming responses (can be added later)
- Per-call provider selection (will be global config via env vars)

## Technical Design

### 1. Provider Configuration

```typescript
// Environment variable: LLM_PROVIDER
// Values: "claude-code" (default) | "wandb-inference"

interface ProviderConfig {
  provider: "claude-code" | "wandb-inference";
  baseUrl?: string;      // For W&B Inference: https://api.inference.wandb.ai/v1
  apiKey?: string;       // WANDB_API_KEY for W&B Inference
  project?: string;      // WEAVE_PROJECT for tracking
}
```

### 2. Model Tier Abstraction

Replace specific model names with semantic tiers:

```typescript
// New model tier system
type ModelTier = "large" | "small";

// Provider-specific model mapping
const MODEL_MAP = {
  "claude-code": {
    large: "sonnet",   // Claude 3.5 Sonnet
    small: "haiku",    // Claude 3 Haiku
  },
  "wandb-inference": {
    large: "openai/gpt-oss-120b",
    small: "openai/gpt-oss-20b",
  },
};

// Backward compatibility aliases
type LegacyModel = "opus" | "sonnet" | "haiku";
const LEGACY_TO_TIER: Record<LegacyModel, ModelTier> = {
  opus: "large",
  sonnet: "large",
  haiku: "small",
};
```

### 3. Updated AIClientConfig

```typescript
export interface AIClientConfig {
  /**
   * Model tier to use: 'large' or 'small'
   * - large: More capable, use for complex tasks (sonnet/gpt-oss-120b)
   * - small: Faster, use for simple tasks (haiku/gpt-oss-20b)
   */
  model?: ModelTier | LegacyModel;  // Support both new and legacy
}
```

### 4. Provider Factory

```typescript
// src/lib/ai/providers/index.ts
export function createProvider(): LanguageModelV1 {
  const providerType = getProviderType();

  switch (providerType) {
    case "wandb-inference":
      return createWandBProvider();
    case "claude-code":
    default:
      return createClaudeCodeProvider();
  }
}
```

### 5. W&B Inference Provider

Use Vercel AI SDK's OpenAI provider with custom configuration:

```typescript
// src/lib/ai/providers/wandb-inference.ts
import { createOpenAI } from "@ai-sdk/openai";

export function createWandBProvider() {
  return createOpenAI({
    baseURL: "https://api.inference.wandb.ai/v1",
    apiKey: process.env.WANDB_API_KEY,
    headers: {
      "OpenAI-Project": process.env.WEAVE_PROJECT || "",
    },
  });
}
```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `LLM_PROVIDER` | Provider to use | `claude-code` or `wandb-inference` |
| `WANDB_API_KEY` | W&B API key (required for wandb-inference) | `your-api-key` |
| `WEAVE_PROJECT` | W&B project for tracking | `team/project` |

## File Changes

### New Files
- `packages/data/src/lib/ai/providers/index.ts` - Provider factory
- `packages/data/src/lib/ai/providers/wandb-inference.ts` - W&B Inference provider
- `packages/data/src/lib/ai/providers/claude-code.ts` - Claude Code provider (refactored)
- `packages/data/src/lib/ai/models.ts` - Model tier definitions and mapping

### Modified Files
- `packages/data/src/lib/ai/client.ts` - Use provider factory, support model tiers
- `packages/data/.env.example` - Add new environment variables
- `apps/web/.env.example` - Add new environment variables

## Implementation Plan

### Phase 1: Provider Abstraction
1. Create model tier definitions and mapping (`models.ts`)
2. Create provider factory structure (`providers/index.ts`)
3. Extract Claude Code provider to dedicated file
4. Add backward compatibility for legacy model names

### Phase 2: W&B Inference Provider
1. Add `@ai-sdk/openai` dependency
2. Implement W&B Inference provider configuration
3. Wire up provider selection via environment variable

### Phase 3: Client Integration
1. Update `client.ts` to use provider factory
2. Update telemetry to track provider information
3. Test both providers with structured and text output

### Phase 4: Documentation & Testing
1. Update `.env.example` files
2. Add usage documentation
3. Test intake flow with both providers

## Rollback Plan

If issues occur:
1. Set `LLM_PROVIDER=claude-code` (or unset it) to revert to Claude Code
2. The existing code path remains intact as the default

## Success Criteria

1. Can generate structured output with W&B Inference provider
2. Can generate text output with W&B Inference provider
3. Switching providers requires only environment variable change
4. Weave tracing works with both providers
5. Existing code using legacy model names continues to work
