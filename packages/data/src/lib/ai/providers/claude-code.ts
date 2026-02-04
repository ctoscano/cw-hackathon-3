/**
 * Claude Code provider for the Vercel AI SDK.
 *
 * This provider uses the Claude Code CLI authentication for API access.
 * Supports opus, sonnet, and haiku models from the Claude 3 family.
 */

import type { LanguageModel } from "ai";
import { claudeCode } from "ai-sdk-provider-claude-code";

/** Claude Code model names */
export type ClaudeCodeModel = "opus" | "sonnet" | "haiku";

/**
 * Create a Claude Code language model instance.
 *
 * @param modelName - The model name: 'opus', 'sonnet', or 'haiku'
 * @returns A Vercel AI SDK compatible language model
 */
export function createClaudeCodeModel(modelName: string): LanguageModel {
  // The claude code provider accepts model names directly
  return claudeCode(modelName as ClaudeCodeModel);
}
