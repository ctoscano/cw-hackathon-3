/**
 * Web exports for static data routes (no AI, no Redis)
 * Smallest possible bundle - only metadata and question data
 */

// Intake metadata and questions - NO AI, NO Redis
export {
  getIntakeMetadata,
  getFirstQuestion,
  getAllQuestions,
} from "./lib/intake/index.js";

// Types come from intake-schemas.js
export type {
  IntakeQuestion,
  IntakeDefinition,
} from "./lib/ai/intake-schemas.js";
