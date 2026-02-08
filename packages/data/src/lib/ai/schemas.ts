import { z } from "zod";

/**
 * DAP Note Schema - Structured documentation format for therapy sessions
 * DAP = Data, Assessment, Plan
 */
export const DAPNoteSchema = z.object({
  data: z.object({
    subjective: z
      .string()
      .describe(
        "Client's self-reported information, feelings, and experiences shared during the session. Include direct quotes when relevant.",
      ),
    objective: z
      .string()
      .describe(
        "Therapist's clinical observations including affect, behavior, appearance, and measurable data. Focus on observable facts.",
      ),
  }),
  assessment: z.object({
    clinicalImpression: z
      .string()
      .describe(
        "Professional clinical interpretation synthesizing subjective and objective data. Include diagnostic considerations.",
      ),
    progress: z
      .string()
      .describe(
        "Client's progress toward established treatment goals. Note improvements, setbacks, or maintenance of gains.",
      ),
    riskAssessment: z
      .string()
      .describe(
        "Assessment of safety concerns including suicidal/homicidal ideation, self-harm, and protective factors. State 'No acute safety concerns identified' if applicable.",
      ),
  }),
  plan: z.object({
    interventions: z
      .array(z.string())
      .describe(
        "Specific therapeutic interventions used during this session and planned for future sessions.",
      ),
    homework: z
      .string()
      .optional()
      .describe(
        "Between-session assignments, exercises, or activities for the client to complete.",
      ),
    nextSession: z
      .string()
      .describe("Focus areas, goals, and topics to address in the next scheduled session."),
    referrals: z
      .array(z.string())
      .optional()
      .describe(
        "Any referrals made or recommended including psychiatry, medical, support groups, etc.",
      ),
  }),
  metadata: z.object({
    sessionDate: z.string().describe("Date of the therapy session (YYYY-MM-DD format)"),
    sessionDuration: z
      .string()
      .describe("Duration of the session (e.g., '50 minutes', '90 minutes')"),
    sessionType: z
      .string()
      .describe("Type of session: individual, couples, family, group, telehealth, in-person"),
    billingCode: z
      .string()
      .optional()
      .describe(
        "Suggested CPT billing code based on session type and duration (e.g., 90834, 90837, 90847)",
      ),
  }),
});

export type DAPNote = z.infer<typeof DAPNoteSchema>;

/**
 * Therapist Session Input - What a therapist might verbally describe about a session
 * Used for generating synthetic training/test data
 */
export const TherapistSessionInputSchema = z.object({
  scenario: z.string().describe("Brief clinical scenario description (1-2 sentences)"),
  therapeuticApproach: z
    .string()
    .describe("Primary therapeutic modality used (e.g., CBT, DBT, psychodynamic, person-centered)"),
  patientPresentation: z
    .string()
    .describe("How the patient presented: mood, affect, engagement level, notable behaviors"),
  keyThemes: z
    .array(z.string())
    .describe("Main themes, topics, or issues discussed during the session"),
  interventions: z
    .array(z.string())
    .describe("Specific therapeutic interventions employed during the session"),
  sessionNarrative: z
    .string()
    .describe(
      "Detailed first-person narrative of what the therapist would say when describing the session verbally. Should be conversational, as if speaking to a colleague.",
    ),
});

export type TherapistSessionInput = z.infer<typeof TherapistSessionInputSchema>;

/**
 * Configuration for synthetic data generation
 */
export const SyntheticGenerationConfigSchema = z.object({
  count: z
    .number()
    .int()
    .positive()
    .default(1)
    .describe("Number of synthetic examples to generate"),
  scenarioType: z
    .enum(["depression", "anxiety", "trauma", "relationship", "grief", "substance", "mixed"])
    .optional()
    .describe("Type of clinical scenario to generate, or random if not specified"),
  therapeuticModality: z
    .enum(["cbt", "dbt", "psychodynamic", "person-centered", "integrative", "mixed"])
    .optional()
    .describe("Therapeutic approach to use in the scenario"),
});

export type SyntheticGenerationConfig = z.infer<typeof SyntheticGenerationConfigSchema>;

/**
 * Evaluation result from self-assessment
 */
export const EvaluationResultSchema = z.object({
  overallScore: z.number().min(1).max(10).describe("Overall quality score from 1-10"),
  dimensions: z.object({
    completeness: z
      .number()
      .min(1)
      .max(10)
      .describe("Are all required sections complete and thorough?"),
    accuracy: z.number().min(1).max(10).describe("Does the output accurately reflect the input?"),
    clinicalAppropriate: z
      .number()
      .min(1)
      .max(10)
      .describe("Is the language clinically appropriate for documentation?"),
    insuranceCompliance: z
      .number()
      .min(1)
      .max(10)
      .describe("Does the note meet insurance documentation requirements?"),
    actionability: z
      .number()
      .min(1)
      .max(10)
      .describe("Is the treatment plan clear and actionable?"),
  }),
  strengths: z.array(z.string()).describe("Specific strengths of the generated DAP note"),
  improvements: z.array(z.string()).describe("Specific areas that need improvement"),
  promptSuggestions: z
    .array(z.string())
    .describe("Concrete suggestions for improving the prompt to get better results"),
});

export type EvaluationResult = z.infer<typeof EvaluationResultSchema>;

/**
 * Prompt metadata from frontmatter
 */
export const PromptMetadataSchema = z.object({
  name: z.string().describe("Unique identifier for the prompt"),
  description: z.string().optional().describe("What this prompt does"),
  version: z.string().optional().describe("Semantic version of the prompt"),
  variables: z
    .array(z.string())
    .optional()
    .describe("Variables that can be substituted in the prompt"),
  author: z.string().optional().describe("Who created this prompt"),
});

export type PromptMetadata = z.infer<typeof PromptMetadataSchema>;

/**
 * Generate a human-readable description of a Zod schema
 * Useful for including in prompt artifacts to show expected output format
 *
 * Note: Accesses Zod internal _def properties for description/values extraction
 */
export function describeSchema(schema: z.ZodTypeAny, name: string, indent = 0): string {
  const pad = "  ".repeat(indent);
  const lines: string[] = [];

  if (indent === 0) {
    lines.push(`${name} {`);
  }

  if (schema instanceof z.ZodObject) {
    const shape = schema.shape;
    for (const [key, value] of Object.entries(shape)) {
      const zodValue = value as z.ZodTypeAny;
      // biome-ignore lint/suspicious/noExplicitAny: Accessing Zod internal _def for description
      const description = (zodValue._def as any).description || "";
      const isOptional = zodValue instanceof z.ZodOptional;
      const innerType = isOptional ? (zodValue as z.ZodOptional<z.ZodTypeAny>).unwrap() : zodValue;

      if (innerType instanceof z.ZodObject) {
        lines.push(`${pad}  ${key}${isOptional ? "?" : ""}: {`);
        lines.push(describeSchema(innerType, "", indent + 2));
        lines.push(`${pad}  }${description ? `  // ${description}` : ""}`);
      } else if (innerType instanceof z.ZodArray) {
        const elementType = innerType.element;
        if (elementType instanceof z.ZodString) {
          lines.push(
            `${pad}  ${key}${isOptional ? "?" : ""}: string[]${description ? `  // ${description}` : ""}`,
          );
        } else if (elementType instanceof z.ZodObject) {
          lines.push(`${pad}  ${key}${isOptional ? "?" : ""}: [{`);
          lines.push(describeSchema(elementType, "", indent + 2));
          lines.push(`${pad}  }]${description ? `  // ${description}` : ""}`);
        } else {
          lines.push(
            `${pad}  ${key}${isOptional ? "?" : ""}: array${description ? `  // ${description}` : ""}`,
          );
        }
      } else if (innerType instanceof z.ZodString) {
        lines.push(
          `${pad}  ${key}${isOptional ? "?" : ""}: string${description ? `  // ${description}` : ""}`,
        );
      } else if (innerType instanceof z.ZodNumber) {
        lines.push(
          `${pad}  ${key}${isOptional ? "?" : ""}: number${description ? `  // ${description}` : ""}`,
        );
      } else if (innerType instanceof z.ZodBoolean) {
        lines.push(
          `${pad}  ${key}${isOptional ? "?" : ""}: boolean${description ? `  // ${description}` : ""}`,
        );
      } else if (innerType instanceof z.ZodEnum) {
        // biome-ignore lint/suspicious/noExplicitAny: Accessing Zod internal _def for enum values
        const values = (innerType._def as any).values.join(" | ");
        lines.push(
          `${pad}  ${key}${isOptional ? "?" : ""}: ${values}${description ? `  // ${description}` : ""}`,
        );
      } else {
        lines.push(
          `${pad}  ${key}${isOptional ? "?" : ""}: unknown${description ? `  // ${description}` : ""}`,
        );
      }
    }
  }

  if (indent === 0) {
    lines.push("}");
  }

  return lines.join("\n");
}

/**
 * Pre-generated schema descriptions for common schemas
 */
export const SchemaDescriptions = {
  DAPNote: describeSchema(DAPNoteSchema, "DAPNote"),
  TherapistSessionInput: describeSchema(TherapistSessionInputSchema, "TherapistSessionInput"),
  EvaluationResult: describeSchema(EvaluationResultSchema, "EvaluationResult"),
};
