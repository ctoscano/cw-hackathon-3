import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export interface EnvVars {
  LLM_PROVIDER?: string;
  WANDB_API_KEY?: string;
  WEAVE_PROJECT?: string;
  PORT?: string;
}

/**
 * Parse .env file into key-value object
 */
function parseEnvFile(content: string): Record<string, string> {
  const env: Record<string, string> = {};
  const lines = content.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, equalsIndex).trim();
    const value = trimmed.slice(equalsIndex + 1).trim();
    env[key] = value;
  }

  return env;
}

/**
 * Read existing .env file or return empty object
 */
function readEnvFile(filePath: string): Record<string, string> {
  if (!existsSync(filePath)) {
    return {};
  }

  const content = readFileSync(filePath, "utf-8");
  return parseEnvFile(content);
}

/**
 * Write env vars to .env file
 */
function writeEnvFile(filePath: string, vars: Record<string, string>): void {
  const lines: string[] = [];

  for (const [key, value] of Object.entries(vars)) {
    lines.push(`${key}=${value}`);
  }

  writeFileSync(filePath, `${lines.join("\n")}\n`, "utf-8");
}

/**
 * Find the monorepo root by looking for pnpm-workspace.yaml
 */
function findMonorepoRoot(): string {
  let currentDir = process.cwd();
  const root = "/";

  while (currentDir !== root) {
    const workspaceFile = resolve(currentDir, "pnpm-workspace.yaml");
    if (existsSync(workspaceFile)) {
      return currentDir;
    }
    currentDir = dirname(currentDir);
  }

  throw new Error("Could not find monorepo root (pnpm-workspace.yaml not found)");
}

/**
 * Write environment variables to both web and data workspaces
 */
export function writeEnvFiles(vars: EnvVars): void {
  const monorepoRoot = findMonorepoRoot();
  const webEnvPath = resolve(monorepoRoot, "apps/web/.env.local");
  const dataEnvPath = resolve(monorepoRoot, "packages/data/.env");

  // Read existing files
  const webEnv = readEnvFile(webEnvPath);
  const dataEnv = readEnvFile(dataEnvPath);

  // Update with new values
  if (vars.LLM_PROVIDER) {
    webEnv.LLM_PROVIDER = vars.LLM_PROVIDER;
    dataEnv.LLM_PROVIDER = vars.LLM_PROVIDER;
  }

  if (vars.WANDB_API_KEY) {
    webEnv.WANDB_API_KEY = vars.WANDB_API_KEY;
    dataEnv.WANDB_API_KEY = vars.WANDB_API_KEY;
  }

  if (vars.WEAVE_PROJECT) {
    webEnv.WEAVE_PROJECT = vars.WEAVE_PROJECT;
    dataEnv.WEAVE_PROJECT = vars.WEAVE_PROJECT;
  }

  if (vars.PORT) {
    webEnv.PORT = vars.PORT;
  }

  // Write files
  writeEnvFile(webEnvPath, webEnv);
  writeEnvFile(dataEnvPath, dataEnv);
}
