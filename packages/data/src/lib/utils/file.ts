import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

/**
 * Get the output directory path (relative to packages/data)
 */
export function getOutputDir(): string {
  // Find the packages/data directory by looking for package.json
  let dir = process.cwd();

  // If we're in a subdirectory, walk up to find packages/data
  while (dir !== "/" && !existsSync(join(dir, "package.json"))) {
    dir = dirname(dir);
  }

  // Check if we're in the packages/data directory
  const pkgPath = join(dir, "package.json");
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
      if (pkg.name === "@cw-hackathon/data") {
        return join(dir, "output");
      }
    } catch {
      // Ignore parse errors
    }
  }

  // Default to cwd/output
  return join(process.cwd(), "output");
}

/**
 * Ensure a directory exists, creating it if necessary
 */
export function ensureDirectory(dirPath: string): void {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Generate a timestamped filename
 */
export function generateFilename(prefix: string, extension: string): string {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
  return `${prefix}-${timestamp}.${extension}`;
}

/**
 * Save content to a file in the output directory
 *
 * @param subdir - Subdirectory within output (e.g., "synthetic", "dap-notes")
 * @param prefix - Filename prefix
 * @param content - Content to write
 * @param extension - File extension (without dot)
 * @param version - Optional version string (e.g., "v1", "v2") to add as a subdirectory
 * @returns The full path to the saved file
 */
export function saveOutput(
  subdir: string,
  prefix: string,
  content: string,
  extension: string,
  version?: string,
): string {
  const outputDir = getOutputDir();

  // Build path with version subdirectory if provided and not in "synthetic" subdir
  // Synthetic inputs are shared across versions
  let targetDir: string;
  if (version && !subdir.includes("synthetic")) {
    targetDir = join(outputDir, subdir, version);
  } else {
    targetDir = join(outputDir, subdir);
  }

  ensureDirectory(targetDir);

  const filename = generateFilename(prefix, extension);
  const filePath = join(targetDir, filename);

  writeFileSync(filePath, content, "utf-8");

  return filePath;
}

/**
 * Save JSON content with pretty formatting
 */
export function saveJsonOutput<T>(
  subdir: string,
  prefix: string,
  data: T,
  version?: string,
): string {
  const content = JSON.stringify(data, null, 2);
  return saveOutput(subdir, prefix, content, "json", version);
}

/**
 * Save markdown content
 */
export function saveMarkdownOutput(
  subdir: string,
  prefix: string,
  content: string,
  version?: string,
): string {
  return saveOutput(subdir, prefix, content, "md", version);
}

/**
 * Read a file from the output directory
 */
export function readOutputFile(subdir: string, filename: string): string {
  const outputDir = getOutputDir();
  const filePath = join(outputDir, subdir, filename);
  return readFileSync(filePath, "utf-8");
}

/**
 * Read JSON from output directory
 */
export function readJsonOutput<T>(subdir: string, filename: string): T {
  const content = readOutputFile(subdir, filename);
  return JSON.parse(content) as T;
}

/**
 * Get the most recent file in an output subdirectory
 */
export function getLatestOutputFile(subdir: string, extension: string): string | null {
  const outputDir = getOutputDir();
  const targetDir = join(outputDir, subdir);

  if (!existsSync(targetDir)) {
    return null;
  }

  const { readdirSync, statSync } = require("node:fs");
  const files = readdirSync(targetDir)
    .filter((f: string) => f.endsWith(`.${extension}`))
    .map((f: string) => ({
      name: f,
      mtime: statSync(join(targetDir, f)).mtime,
    }))
    .sort((a: { mtime: Date }, b: { mtime: Date }) => b.mtime.getTime() - a.mtime.getTime());

  if (files.length === 0) {
    return null;
  }

  return join(targetDir, files[0].name);
}
