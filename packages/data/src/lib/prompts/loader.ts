import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import matter from "gray-matter";
import type { PromptMetadata } from "../ai/schemas";

/**
 * A loaded prompt with metadata and content
 */
export interface LoadedPrompt {
  meta: PromptMetadata;
  content: string;
  filePath: string;
  promptVersion?: string;
}

/**
 * Variables for prompt substitution
 */
export type PromptVariables = Record<string, string>;

/**
 * Find the prompts directory
 */
function findPromptsDir(): string {
  // Try multiple possible locations in order of likelihood
  const dirs = [
    // Relative to current file (for Bun direct execution from packages/data)
    join(dirname(import.meta.url.replace("file://", "")), "../../prompts"),
    // Direct execution from packages/data
    join(process.cwd(), "src/prompts"),
    // Running from monorepo root
    join(process.cwd(), "packages/data/src/prompts"),
    // Running from apps/web in monorepo
    join(process.cwd(), "../../packages/data/src/prompts"),
    // Running from any app in apps/ directory
    join(process.cwd(), "../..", "packages/data/src/prompts"),
  ];

  for (const dir of dirs) {
    const resolved = resolve(dir);
    if (existsSync(resolved)) {
      return resolved;
    }
  }

  // Default to cwd/src/prompts
  return join(process.cwd(), "src/prompts");
}

/**
 * Load a prompt file and parse its frontmatter
 *
 * @param filePath - Path to the markdown file (absolute or relative to prompts directory)
 * @param options - Optional configuration including version
 * @returns Loaded prompt with metadata and content
 */
export function loadPrompt(filePath: string, options?: { version?: string }): LoadedPrompt {
  const version = options?.version ?? "v3"; // Default to v3 (highest quality: 9.3/10)
  let absolutePath: string;

  if (filePath.startsWith("/")) {
    absolutePath = filePath;
  } else {
    // Try as relative to prompts directory
    const promptsDir = findPromptsDir();

    // If filePath contains a category (e.g., "intake/reflection-system.md"),
    // inject the version into the path (e.g., "intake/v1/reflection-system.md")
    // Skip version injection if version is empty string or if version is already in path
    let versionedPath = filePath;
    const parts = filePath.split("/");
    if (parts.length > 1 && version && version !== "" && !parts.includes(version)) {
      // Insert version after the category (first part)
      parts.splice(1, 0, version);
      versionedPath = parts.join("/");
    }

    absolutePath = join(promptsDir, versionedPath);

    // If not found, try as relative to cwd
    if (!existsSync(absolutePath)) {
      absolutePath = resolve(filePath);
    }
  }

  if (!existsSync(absolutePath)) {
    throw new Error(`Prompt file not found: ${filePath} (tried ${absolutePath})`);
  }

  const fileContent = readFileSync(absolutePath, "utf-8");
  const { data, content } = matter(fileContent);

  const meta: PromptMetadata = {
    name: data.name ?? filePath.replace(/\.md$/, "").replace(/\//g, "-"),
    description: data.description,
    version: data.version,
    variables: data.variables,
    author: data.author,
  };

  return {
    meta,
    content: content.trim(),
    filePath: absolutePath,
    promptVersion: version,
  };
}

/**
 * Apply variable substitution to a prompt
 *
 * Variables are in the format {{variableName}}
 *
 * @param content - The prompt content
 * @param variables - Key-value pairs for substitution
 * @returns Content with variables replaced
 */
export function substituteVariables(content: string, variables: PromptVariables): string {
  let result = content;

  for (const [key, value] of Object.entries(variables)) {
    const pattern = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "g");
    result = result.replace(pattern, value);
  }

  // Warn about unreplaced variables
  const unreplaced = result.match(/\{\{\s*\w+\s*\}\}/g);
  if (unreplaced) {
    console.warn(`[Prompt] Warning: Unreplaced variables: ${unreplaced.join(", ")}`);
  }

  return result;
}

/**
 * Load and process a prompt with variable substitution
 */
export function loadAndSubstitutePrompt(
  filePath: string,
  variables: PromptVariables = {},
  options?: { version?: string },
): LoadedPrompt {
  const prompt = loadPrompt(filePath, options);
  const substitutedContent = substituteVariables(prompt.content, variables);

  return {
    ...prompt,
    content: substitutedContent,
  };
}

/**
 * List available prompts in a directory
 */
export function listPrompts(directory: string): string[] {
  const promptsDir = findPromptsDir();
  const targetDir = join(promptsDir, directory);

  if (!existsSync(targetDir)) {
    return [];
  }

  const { readdirSync } = require("node:fs");
  return readdirSync(targetDir)
    .filter((f: string) => f.endsWith(".md"))
    .map((f: string) => join(directory, f));
}
