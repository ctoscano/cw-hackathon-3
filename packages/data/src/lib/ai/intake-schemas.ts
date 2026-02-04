import { z } from "zod";

/**
 * Question types supported in the intake flow
 */
export const QuestionTypeSchema = z.enum(["text", "multiselect", "singleselect"]);
export type QuestionType = z.infer<typeof QuestionTypeSchema>;

/**
 * Schema for a single intake question definition
 */
export const IntakeQuestionSchema = z.object({
  id: z.string().describe("Unique identifier for the question"),
  prompt: z.string().describe("The question text shown to the user"),
  type: QuestionTypeSchema.describe("Type of input expected: text, multiselect, or singleselect"),
  options: z
    .array(z.string())
    .optional()
    .describe("Options for multiselect or singleselect questions"),
  examples: z
    .array(z.string())
    .optional()
    .describe("Example answers to show as placeholders or hints"),
  clinicalIntention: z
    .string()
    .describe("Creator-facing note explaining the therapeutic purpose of this question"),
});
export type IntakeQuestion = z.infer<typeof IntakeQuestionSchema>;

/**
 * Schema for a completed answer to a question
 */
export const IntakeAnswerSchema = z.object({
  questionId: z.string().describe("ID of the question being answered"),
  questionPrompt: z.string().describe("The question text for context"),
  answer: z
    .union([z.string(), z.array(z.string())])
    .describe("The user's answer - string for text, array for multiselect"),
  reflection: z.string().describe("The generated reflection shown after the answer"),
});
export type IntakeAnswer = z.infer<typeof IntakeAnswerSchema>;

/**
 * Schema for the API request to process an intake step
 */
export const IntakeStepRequestSchema = z.object({
  intakeType: z.string().describe("Type of intake (e.g., 'therapy_readiness')"),
  stepIndex: z.number().int().min(0).describe("Current step index (0-based)"),
  priorAnswers: z.array(IntakeAnswerSchema).describe("All previous answers with reflections"),
  currentAnswer: z
    .union([z.string(), z.array(z.string())])
    .describe("The answer to the current question"),
});
export type IntakeStepRequest = z.infer<typeof IntakeStepRequestSchema>;

/**
 * Schema for the completion outputs generated at the end of the intake
 */
export const IntakeCompletionOutputsSchema = z.object({
  personalizedBrief: z
    .string()
    .describe(
      "How therapy might help - normalizes experience, links patterns to therapy mechanisms, includes example change trajectories, explicitly avoids guarantees",
    ),
  firstSessionGuide: z
    .string()
    .describe(
      "How to make the most of your first session - what to ask for, what to ask about, how to talk about goals, how to assess fit, includes example phrases",
    ),
  experiments: z
    .array(z.string())
    .describe(
      "2-3 safe, personalized pre-therapy experiments - framed as optional, low intensity, reversible, designed to be discussed in session one",
    ),
});
export type IntakeCompletionOutputs = z.infer<typeof IntakeCompletionOutputsSchema>;

/**
 * Schema for the reflection generated after each answer
 */
export const IntakeReflectionSchema = z.object({
  reflection: z
    .string()
    .describe(
      "A 1-2 sentence supportive response that reflects back the meaning, normalizes the experience, and encourages continuation",
    ),
});
export type IntakeReflection = z.infer<typeof IntakeReflectionSchema>;

/**
 * Schema for the API response when processing an intake step
 */
export const IntakeStepResponseSchema = z.object({
  reflection: z.string().describe("The reflective response for the just-submitted answer"),
  nextQuestion: IntakeQuestionSchema.omit({ clinicalIntention: true })
    .nullable()
    .describe("The next question to show, or null if complete"),
  isComplete: z.boolean().describe("Whether the intake is finished"),
  completionOutputs: IntakeCompletionOutputsSchema.nullable().describe(
    "Final outputs when intake is complete, null otherwise",
  ),
  metadata: z.object({
    currentStep: z.number().describe("The step that was just completed"),
    totalSteps: z.number().describe("Total number of steps in this intake"),
    intakeType: z.string().describe("The type of intake being processed"),
    promptVersion: z.string().optional().describe("Version of prompts used (e.g., v1, v2)"),
  }),
});
export type IntakeStepResponse = z.infer<typeof IntakeStepResponseSchema>;

/**
 * Schema for an intake definition containing all questions
 */
export const IntakeDefinitionSchema = z.object({
  id: z.string().describe("Unique identifier for this intake type"),
  name: z.string().describe("Human-readable name"),
  description: z.string().describe("Brief description of the intake purpose"),
  questions: z.array(IntakeQuestionSchema).describe("Ordered list of questions"),
});
export type IntakeDefinition = z.infer<typeof IntakeDefinitionSchema>;
