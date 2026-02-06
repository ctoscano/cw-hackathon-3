/**
 * Web exports for AI-powered routes
 * Only includes dependencies needed for web API routes
 * Does NOT import CLI commands or citty framework
 */

// AI functions for web
export { generateStructuredOutput, generateTextOutput } from "./lib/ai/client.js";
export type { AIResult, AITelemetry, AIClientConfig } from "./lib/ai/client.js";

// Schemas for web
export { DAPNoteSchema, SchemaDescriptions } from "./lib/ai/schemas.js";
export type { DAPNote } from "./lib/ai/schemas.js";

// Intake schemas and processing - all types come from intake-schemas.js
export * from "./lib/ai/intake-schemas.js";
export {
  processIntakeStep,
  generateCompletionOutputs,
  getIntakeMetadata,
  getFirstQuestion,
} from "./lib/intake/index.js";

// Redis archival (needed by dap/generate)
export { archiveDAPOutput } from "./lib/redis/archive.js";

// Prompt building (needed by dap/generate)
export { buildDAPPrompt } from "./lib/prompts/builder.js";
