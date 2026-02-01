import { saveJsonOutput, saveMarkdownOutput, saveOutput } from "../utils/file.js";
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
  /** Additional paths when multiple formats are saved */
  savedPaths?: {
    markdown?: string;
    json?: string;
    copyable?: string;
  };
}

/**
 * Output format options for prompt artifacts
 */
export type PromptOutputFormat = "markdown" | "json" | "copyable" | "all";

/**
 * Options for building a prompt
 */
export interface PromptBuilderOptions {
  systemParts: string[];
  userParts: string[];
  variables?: PromptVariables;
  saveToFile?: boolean;
  outputPrefix?: string;
  /** Output format(s) for saved prompt artifacts */
  outputFormat?: PromptOutputFormat;
  /** Optional schema description to include in output */
  schemaDescription?: string;
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
    outputFormat = "markdown",
    schemaDescription,
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
    savedPaths: {},
  };

  // Save to file for inspection if requested
  if (saveToFile) {
    const formats = outputFormat === "all" ? ["markdown", "json", "copyable"] : [outputFormat];
    const paths = result.savedPaths ?? {};

    for (const format of formats) {
      switch (format) {
        case "markdown": {
          const content = formatBuiltPromptForSaving(result, schemaDescription);
          paths.markdown = saveMarkdownOutput("prompts", outputPrefix, content);
          // For backward compatibility, set savedPath to the markdown version
          if (!result.savedPath) result.savedPath = paths.markdown;
          console.log(`[Prompt] Saved markdown prompt to: ${paths.markdown}`);
          break;
        }
        case "json": {
          const jsonContent = {
            system: result.system,
            user: result.user,
            metadata: {
              ...result.metadata,
              builtAt: result.metadata.builtAt.toISOString(),
            },
            schemaDescription,
          };
          paths.json = saveJsonOutput("prompts", outputPrefix, jsonContent);
          console.log(`[Prompt] Saved JSON prompt to: ${paths.json}`);
          break;
        }
        case "copyable": {
          const content = formatCopyablePrompt(result, schemaDescription);
          paths.copyable = saveOutput("prompts", `${outputPrefix}-copyable`, content, "txt");
          console.log(`[Prompt] Saved copyable prompt to: ${paths.copyable}`);
          break;
        }
      }
    }
    result.savedPaths = paths;
  }

  return result;
}

/**
 * Format a built prompt for saving to a file (markdown format for inspection)
 */
function formatBuiltPromptForSaving(prompt: BuiltPrompt, schemaDescription?: string): string {
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
  ];

  if (schemaDescription) {
    lines.push("## Expected Output Schema", "", "```", schemaDescription, "```", "");
  }

  lines.push(
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
  );

  return lines.join("\n");
}

/**
 * Format a prompt for easy copy-paste into Claude Code or other LLM interfaces
 *
 * This format is designed for:
 * - Direct use with Claude Code Web
 * - Pasting into API playgrounds
 * - External LLM testing
 */
function formatCopyablePrompt(prompt: BuiltPrompt, schemaDescription?: string): string {
  const lines: string[] = [
    "=".repeat(80),
    "COPYABLE PROMPT - Ready for direct use with Claude or other LLMs",
    "=".repeat(80),
    "",
    `Built: ${prompt.metadata.builtAt.toISOString()}`,
    `Parts: ${prompt.metadata.parts.join(", ")}`,
    "",
  ];

  if (schemaDescription) {
    lines.push("-".repeat(40), "EXPECTED OUTPUT FORMAT:", "-".repeat(40), schemaDescription, "");
  }

  lines.push(
    "=".repeat(80),
    "SYSTEM PROMPT (copy this as system message or instructions)",
    "=".repeat(80),
    "",
    prompt.system,
    "",
  );

  if (prompt.user.trim()) {
    lines.push(
      "=".repeat(80),
      "USER PROMPT (copy this as the user message)",
      "=".repeat(80),
      "",
      prompt.user,
      "",
    );
  }

  lines.push("=".repeat(80), "END OF PROMPT", "=".repeat(80));

  return lines.join("\n");
}

/**
 * Build a DAP notes prompt specifically
 */
export function buildDAPPrompt(
  sessionDescription: string,
  options?: { outputFormat?: PromptOutputFormat; schemaDescription?: string },
): BuiltPrompt {
  return buildPrompt({
    systemParts: ["dap-notes/system.md"],
    userParts: ["dap-notes/user.md"],
    variables: {
      sessionDescription,
    },
    saveToFile: true,
    outputPrefix: "dap-prompt",
    outputFormat: options?.outputFormat,
    schemaDescription: options?.schemaDescription,
  });
}

/**
 * Build a synthetic generation prompt
 */
export function buildSyntheticPrompt(config: {
  scenarioType?: string;
  therapeuticModality?: string;
  outputFormat?: PromptOutputFormat;
  schemaDescription?: string;
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
    outputFormat: config.outputFormat,
    schemaDescription: config.schemaDescription,
  });
}

/**
 * Build an evaluation prompt
 */
export function buildEvaluationPrompt(options: {
  sessionInput: string;
  dapOutput: string;
  outputFormat?: PromptOutputFormat;
  schemaDescription?: string;
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
    outputFormat: options.outputFormat,
    schemaDescription: options.schemaDescription,
  });
}
