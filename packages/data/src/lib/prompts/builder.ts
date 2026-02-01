import { saveMarkdownOutput } from "../utils/file.js";
import { type PromptVariables, loadPrompt, substituteVariables } from "./loader.js";

/**
 * A built prompt with full context
 */
export interface BuiltPrompt {
  system: string;
  user: string;
  metadata: {
    parts: string[];
    variables: PromptVariables;
    builtAt: Date;
  };
  savedPath?: string;
}

/**
 * Options for building a prompt
 */
export interface PromptBuilderOptions {
  systemParts: string[];
  userParts: string[];
  variables?: PromptVariables;
  saveToFile?: boolean;
  outputPrefix?: string;
}

/**
 * Build a complete prompt from multiple markdown files
 *
 * This function:
 * 1. Loads multiple prompt parts from markdown files
 * 2. Concatenates them with section separators
 * 3. Applies variable substitution
 * 4. Optionally saves the built prompt to a file for inspection
 *
 * @param options - Builder configuration
 * @returns The built prompt ready for AI consumption
 */
export function buildPrompt(options: PromptBuilderOptions): BuiltPrompt {
  const {
    systemParts,
    userParts,
    variables = {},
    saveToFile = true,
    outputPrefix = "prompt",
  } = options;

  // Load and concatenate system prompt parts
  const systemContents: string[] = [];
  for (const part of systemParts) {
    const prompt = loadPrompt(part);
    systemContents.push(prompt.content);
  }
  const systemRaw = systemContents.join("\n\n---\n\n");
  const system = substituteVariables(systemRaw, variables);

  // Load and concatenate user prompt parts
  const userContents: string[] = [];
  for (const part of userParts) {
    const prompt = loadPrompt(part);
    userContents.push(prompt.content);
  }
  const userRaw = userContents.join("\n\n---\n\n");
  const user = substituteVariables(userRaw, variables);

  const result: BuiltPrompt = {
    system,
    user,
    metadata: {
      parts: [...systemParts, ...userParts],
      variables,
      builtAt: new Date(),
    },
  };

  // Save to file for inspection if requested
  if (saveToFile) {
    const content = formatBuiltPromptForSaving(result);
    result.savedPath = saveMarkdownOutput("prompts", outputPrefix, content);
    console.log(`[Prompt] Saved built prompt to: ${result.savedPath}`);
  }

  return result;
}

/**
 * Format a built prompt for saving to a file
 */
function formatBuiltPromptForSaving(prompt: BuiltPrompt): string {
  const lines: string[] = [
    "# Built Prompt",
    "",
    `Built at: ${prompt.metadata.builtAt.toISOString()}`,
    "",
    "## Parts Used",
    "",
    ...prompt.metadata.parts.map((p) => `- ${p}`),
    "",
    "## Variables",
    "",
    "```json",
    JSON.stringify(prompt.metadata.variables, null, 2),
    "```",
    "",
    "---",
    "",
    "## System Prompt",
    "",
    prompt.system,
    "",
    "---",
    "",
    "## User Prompt",
    "",
    prompt.user,
  ];

  return lines.join("\n");
}

/**
 * Build a DAP notes prompt specifically
 */
export function buildDAPPrompt(sessionDescription: string): BuiltPrompt {
  return buildPrompt({
    systemParts: ["dap-notes/system.md"],
    userParts: ["dap-notes/user.md"],
    variables: {
      sessionDescription,
    },
    saveToFile: true,
    outputPrefix: "dap-prompt",
  });
}

/**
 * Build a synthetic generation prompt
 */
export function buildSyntheticPrompt(config: {
  scenarioType?: string;
  therapeuticModality?: string;
}): BuiltPrompt {
  return buildPrompt({
    systemParts: ["synthetic/therapist-session.md"],
    userParts: [],
    variables: {
      scenarioType: config.scenarioType ?? "mixed (any clinical scenario)",
      therapeuticModality: config.therapeuticModality ?? "integrative (any modality)",
    },
    saveToFile: true,
    outputPrefix: "synthetic-prompt",
  });
}

/**
 * Build an evaluation prompt
 */
export function buildEvaluationPrompt(options: {
  sessionInput: string;
  dapOutput: string;
}): BuiltPrompt {
  return buildPrompt({
    systemParts: ["evaluation/system.md"],
    userParts: ["evaluation/user.md"],
    variables: {
      sessionInput: options.sessionInput,
      dapOutput: options.dapOutput,
    },
    saveToFile: true,
    outputPrefix: "eval-prompt",
  });
}
