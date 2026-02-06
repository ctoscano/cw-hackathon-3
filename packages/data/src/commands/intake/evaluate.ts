import { existsSync, readFileSync } from "node:fs";
import { defineCommand } from "citty";
import { z } from "zod";
import { formatTelemetry, generateStructuredOutput } from "../../lib/ai/client";
import type { IntakeAnswer, IntakeCompletionOutputs } from "../../lib/ai/intake-schemas";
import { processIntakeStep } from "../../lib/intake/builder";
import { getIntakeDefinition } from "../../lib/intake/definitions";
import { getLatestOutputFile, saveJsonOutput, saveMarkdownOutput } from "../../lib/utils/file";

/**
 * Schema for evaluating reflection quality
 */
const ReflectionEvaluationSchema = z.object({
  empathicAccuracy: z
    .number()
    .min(1)
    .max(10)
    .describe("How well the reflection captures meaning (1-10)"),
  normalizationValidation: z
    .number()
    .min(1)
    .max(10)
    .describe("How well it normalizes and validates (1-10)"),
  appropriateBrevity: z.number().min(1).max(10).describe("Is it concise yet meaningful (1-10)"),
  toneConsistency: z
    .number()
    .min(1)
    .max(10)
    .describe("Warm, professional, non-clinical tone (1-10)"),
  feedback: z.string().describe("Specific feedback for this reflection"),
});

/**
 * Schema for evaluating completion outputs
 */
const CompletionEvaluationSchema = z.object({
  personalization: z
    .number()
    .min(1)
    .max(10)
    .describe("How tailored to user's specific answers (1-10)"),
  actionability: z.number().min(1).max(10).describe("Practical usefulness of guidance (1-10)"),
  appropriateBoundaries: z
    .number()
    .min(1)
    .max(10)
    .describe("Stays within appropriate scope (1-10)"),
  empowermentOverPressure: z
    .number()
    .min(1)
    .max(10)
    .describe("Supports choice vs pressuring therapy (1-10)"),
  feedback: z.string().describe("Specific feedback for completion outputs"),
});

/**
 * Full intake evaluation schema
 */
const IntakeEvaluationSchema = z.object({
  overallScore: z.number().min(1).max(10).describe("Overall quality score"),
  reflectionScores: z.object({
    empathicAccuracy: z.number().describe("Average empathic accuracy across reflections"),
    normalizationValidation: z.number().describe("Average normalization/validation"),
    appropriateBrevity: z.number().describe("Average brevity appropriateness"),
    toneConsistency: z.number().describe("Average tone consistency"),
  }),
  completionScores: z.object({
    personalization: z.number().describe("Personalization score"),
    actionability: z.number().describe("Actionability score"),
    appropriateBoundaries: z.number().describe("Appropriate boundaries score"),
    empowermentOverPressure: z.number().describe("Empowerment vs pressure score"),
  }),
  reflectionFeedback: z
    .array(
      z.object({
        questionIndex: z.number(),
        score: z.number(),
        feedback: z.string(),
      }),
    )
    .describe("Per-reflection feedback"),
  completionFeedback: z.string().describe("Feedback on completion outputs"),
  strengths: z.array(z.string()).describe("Key strengths of the intake experience"),
  improvements: z.array(z.string()).describe("Areas for improvement"),
  promptSuggestions: z.array(z.string()).describe("Specific prompt engineering suggestions"),
});

type IntakeEvaluation = z.infer<typeof IntakeEvaluationSchema>;

export const evaluateCommand = defineCommand({
  meta: {
    name: "evaluate",
    description: "Evaluate the quality of intake questionnaire reflections and completion outputs",
  },
  args: {
    input: {
      type: "string",
      description: "Path to synthetic intake JSON file. If not provided, uses latest.",
      required: false,
    },
    scenario: {
      type: "string",
      description:
        "Scenario to evaluate: ambivalent, ready, pastNegative, externalPressure, notRightTime",
      default: "ambivalent",
    },
    version: {
      type: "string",
      description: "Prompt version to use (v1, v2, etc.)",
      default: "v2",
    },
    model: {
      type: "string",
      description: "AI model to use for evaluation: opus, sonnet, haiku",
      default: "sonnet",
    },
    skipGeneration: {
      type: "boolean",
      description: "Skip generating outputs, evaluate from existing file only",
      alias: "s",
      default: false,
    },
  },
  async run({ args }) {
    console.log("\n🔍 Intake Questionnaire Evaluator\n");
    console.log(`📌 Prompt Version: ${args.version}\n`);

    // Get synthetic flow data
    let syntheticFlow: {
      scenario: string;
      scenarioName: string;
      answers: Array<{
        stepIndex: number;
        questionId: string;
        questionPrompt: string;
        answer: string | string[];
      }>;
    };
    let syntheticSource: string;

    if (args.input && existsSync(args.input)) {
      syntheticFlow = JSON.parse(readFileSync(args.input, "utf-8"));
      syntheticSource = args.input;
    } else {
      const latestSynthetic = getLatestOutputFile("intake/synthetic", "json");
      if (latestSynthetic) {
        syntheticFlow = JSON.parse(readFileSync(latestSynthetic, "utf-8"));
        syntheticSource = latestSynthetic;
      } else {
        console.error("❌ No synthetic intake found. Run `intake synthetic` first.");
        return { success: false, error: "No synthetic intake found" };
      }
    }

    console.log(`📄 Synthetic Flow: ${syntheticSource}`);
    console.log(`📋 Scenario: ${syntheticFlow.scenarioName || syntheticFlow.scenario}`);

    // Run through the intake to generate outputs
    console.log("\n🔄 Running intake flow to generate outputs...\n");

    const intake = getIntakeDefinition("therapy_readiness");
    if (!intake) {
      console.error("❌ Intake definition not found");
      return { success: false, error: "Intake not found" };
    }

    const generatedAnswers: IntakeAnswer[] = [];
    let completionOutputs: IntakeCompletionOutputs | null = null;

    for (let i = 0; i < syntheticFlow.answers.length; i++) {
      const answer = syntheticFlow.answers[i];
      console.log(
        `  Step ${i + 1}/${syntheticFlow.answers.length}: ${answer.questionPrompt.slice(0, 50)}...`,
      );

      try {
        const result = await processIntakeStep({
          request: {
            intakeType: "therapy_readiness",
            stepIndex: i,
            priorAnswers: generatedAnswers,
            currentAnswer: answer.answer,
          },
          version: args.version,
        });

        generatedAnswers.push({
          questionId: answer.questionId,
          questionPrompt: answer.questionPrompt,
          answer: answer.answer,
          reflection: result.reflection,
        });

        if (result.isComplete && result.completionOutputs) {
          completionOutputs = result.completionOutputs;
        }

        console.log(`    ✓ Reflection: "${result.reflection.slice(0, 60)}..."`);
      } catch (error) {
        console.error(`    ❌ Error: ${error}`);
        return { success: false, error: `Failed at step ${i}` };
      }
    }

    if (!completionOutputs) {
      console.error("❌ No completion outputs generated");
      return { success: false, error: "No completion outputs" };
    }

    console.log("\n✅ Generated all reflections and completion outputs");

    // Save generated outputs for reference
    const generatedOutput = {
      scenario: syntheticFlow.scenario,
      answers: generatedAnswers,
      completionOutputs,
      metadata: {
        promptVersion: args.version,
        scenario: syntheticFlow.scenario,
        generatedAt: new Date().toISOString(),
      },
    };
    const generatedPath = saveJsonOutput(
      "intake/generated",
      `intake-generated-${syntheticFlow.scenario}`,
      generatedOutput,
      args.version,
    );
    console.log(`📁 Saved generated outputs: ${generatedPath}`);

    // Build evaluation prompt
    console.log("\n🤖 Running quality evaluation...\n");

    const evaluationPrompt = buildEvaluationPrompt(generatedAnswers, completionOutputs);

    const result = await generateStructuredOutput({
      schema: IntakeEvaluationSchema,
      prompt: evaluationPrompt.user,
      system: evaluationPrompt.system,
      config: {
        model: args.model as "opus" | "sonnet" | "haiku",
      },
    });

    // Save evaluation results with version metadata
    const evalData = {
      ...result.data,
      metadata: {
        promptVersion: args.version,
        scenario: syntheticFlow.scenario,
        evaluatedAt: new Date().toISOString(),
      },
    };
    const evalJsonPath = saveJsonOutput(
      "intake/evaluations",
      `intake-eval-${syntheticFlow.scenario}`,
      evalData,
      args.version,
    );
    const evalMarkdownPath = saveMarkdownOutput(
      "intake/evaluations",
      `intake-eval-${syntheticFlow.scenario}`,
      formatEvaluationAsMarkdown(
        result.data,
        syntheticFlow.scenario,
        generatedAnswers,
        completionOutputs,
        args.version,
      ),
      args.version,
    );

    console.log("✅ Evaluation complete!\n");
    console.log("📁 Output files:");
    console.log(`   JSON: ${evalJsonPath}`);
    console.log(`   Markdown: ${evalMarkdownPath}`);

    // Print summary
    printEvaluationSummary(result.data);

    console.log("\n📊 Telemetry:");
    console.log(formatTelemetry(result.telemetry));

    return {
      success: true,
      evaluation: result.data,
      files: {
        json: evalJsonPath,
        markdown: evalMarkdownPath,
        generated: generatedPath,
      },
      telemetry: result.telemetry,
    };
  },
});

function buildEvaluationPrompt(
  answers: IntakeAnswer[],
  completionOutputs: IntakeCompletionOutputs,
): { system: string; user: string } {
  const system = `# Therapy Readiness Assessment Evaluation Specialist

You are an expert evaluator of intake questionnaire experiences, with deep expertise in:
- 15+ years in intake assessment and patient engagement
- Licensed clinical psychologist background
- Expertise in motivational interviewing and health communication
- User experience in mental health technology

## Your Task

Evaluate the quality of an intake questionnaire flow, including:
1. **Reflections** - The supportive responses after each user answer
2. **Completion Outputs** - The personalized brief, first session guide, and experiments

## Evaluation Criteria

### Reflection Quality (50% of total)

**Empathic Accuracy (15%)**: Does the reflection capture the meaning behind the answer?
- 9-10: Deeply resonant, captures unspoken meaning
- 7-8: Accurate with good empathy
- 5-6: Somewhat accurate, misses nuance
- 1-4: Surface-level or misunderstands

**Normalization & Validation (15%)**: Does it help the user feel less alone?
- 9-10: User would feel deeply understood and normal
- 7-8: Good normalization, appropriately validating
- 5-6: Some normalization but formulaic
- 1-4: Dismissive or pathologizing

**Appropriate Brevity (10%)**: Is it concise yet meaningful?
- 9-10: Perfect length, every word counts
- 7-8: Appropriate, minor trimming possible
- 5-6: Slightly too long or padded
- 1-4: Too verbose or too thin

**Tone Consistency (10%)**: Warm, professional, non-clinical?
- 9-10: Feels like a thoughtful friend who understands therapy
- 7-8: Good tone with minor slips
- 5-6: Inconsistent tone
- 1-4: Too clinical or inappropriate

### Completion Output Quality (50% of total)

**Personalization (15%)**: Tailored to specific answers?
- 9-10: Feels written for this specific person
- 7-8: Good personalization with references
- 5-6: Some personalization, some generic
- 1-4: Mostly generic

**Actionability (15%)**: Practical usefulness?
- 9-10: User could act immediately
- 7-8: Mostly actionable
- 5-6: Some useful guidance, some vague
- 1-4: Limited practical value

**Appropriate Boundaries (10%)**: Stays within scope?
- 9-10: Perfect boundaries
- 7-8: Good boundaries, minor overreach
- 5-6: Some boundary issues
- 1-4: Crosses into diagnosis/therapy

**Empowerment Over Pressure (10%)**: Supports choice?
- 9-10: User feels empowered, not pressured
- 7-8: Good empowerment, minor pressure
- 5-6: Some pressure present
- 1-4: Feels pushy or manipulative

Be specific in your feedback. Reference actual content from the reflections and outputs.`;

  const formattedAnswers = answers
    .map(
      (a, i) =>
        `### Question ${i + 1}: ${a.questionPrompt}
**Answer**: ${Array.isArray(a.answer) ? a.answer.join(", ") : a.answer}
**Reflection**: ${a.reflection}`,
    )
    .join("\n\n");

  const user = `# Intake Flow to Evaluate

## Questions and Reflections

${formattedAnswers}

---

## Completion Outputs

### Personalized Brief
${completionOutputs.personalizedBrief}

### First Session Guide
${completionOutputs.firstSessionGuide}

### Pre-Therapy Experiments
${completionOutputs.experiments.map((e, i) => `${i + 1}. ${e}`).join("\n")}

---

Please evaluate this intake experience according to the criteria. Provide:
1. Scores for each dimension
2. Specific feedback for reflections (noting which ones are strong/weak)
3. Specific feedback for completion outputs
4. Overall strengths and areas for improvement
5. Actionable prompt engineering suggestions`;

  return { system, user };
}

function printEvaluationSummary(evaluation: IntakeEvaluation): void {
  console.log("--- Evaluation Summary ---\n");

  console.log(`📊 Overall Score: ${evaluation.overallScore}/10\n`);

  console.log("📈 Reflection Scores:");
  console.log(
    `   Empathic Accuracy:        ${evaluation.reflectionScores.empathicAccuracy.toFixed(1)}/10`,
  );
  console.log(
    `   Normalization/Validation: ${evaluation.reflectionScores.normalizationValidation.toFixed(1)}/10`,
  );
  console.log(
    `   Appropriate Brevity:      ${evaluation.reflectionScores.appropriateBrevity.toFixed(1)}/10`,
  );
  console.log(
    `   Tone Consistency:         ${evaluation.reflectionScores.toneConsistency.toFixed(1)}/10`,
  );

  console.log("\n📈 Completion Scores:");
  console.log(`   Personalization:          ${evaluation.completionScores.personalization}/10`);
  console.log(`   Actionability:            ${evaluation.completionScores.actionability}/10`);
  console.log(
    `   Appropriate Boundaries:   ${evaluation.completionScores.appropriateBoundaries}/10`,
  );
  console.log(
    `   Empowerment/Pressure:     ${evaluation.completionScores.empowermentOverPressure}/10`,
  );

  console.log("\n✅ Strengths:");
  for (const s of evaluation.strengths) {
    console.log(`   • ${s}`);
  }

  console.log("\n⚠️  Areas for Improvement:");
  for (const i of evaluation.improvements) {
    console.log(`   • ${i}`);
  }

  console.log("\n💡 Prompt Suggestions:");
  for (const p of evaluation.promptSuggestions) {
    console.log(`   • ${p}`);
  }
}

function formatEvaluationAsMarkdown(
  evaluation: IntakeEvaluation,
  scenario: string,
  answers: IntakeAnswer[],
  completionOutputs: IntakeCompletionOutputs,
  promptVersion?: string,
): string {
  const reflectionAvg =
    (evaluation.reflectionScores.empathicAccuracy +
      evaluation.reflectionScores.normalizationValidation +
      evaluation.reflectionScores.appropriateBrevity +
      evaluation.reflectionScores.toneConsistency) /
    4;

  const completionAvg =
    (evaluation.completionScores.personalization +
      evaluation.completionScores.actionability +
      evaluation.completionScores.appropriateBoundaries +
      evaluation.completionScores.empowermentOverPressure) /
    4;

  const lines = [
    "# Intake Questionnaire Quality Evaluation",
    "",
    `Generated: ${new Date().toISOString()}`,
    `Scenario: ${scenario}`,
    `Prompt Version: ${promptVersion || "unknown"}`,
    "",
    "---",
    "",
    "## Overall Score",
    "",
    `# ${evaluation.overallScore}/10`,
    "",
    "---",
    "",
    "## Reflection Quality",
    "",
    `**Average**: ${reflectionAvg.toFixed(1)}/10`,
    "",
    "| Dimension | Score |",
    "|-----------|-------|",
    `| Empathic Accuracy | ${evaluation.reflectionScores.empathicAccuracy.toFixed(1)}/10 |`,
    `| Normalization & Validation | ${evaluation.reflectionScores.normalizationValidation.toFixed(1)}/10 |`,
    `| Appropriate Brevity | ${evaluation.reflectionScores.appropriateBrevity.toFixed(1)}/10 |`,
    `| Tone Consistency | ${evaluation.reflectionScores.toneConsistency.toFixed(1)}/10 |`,
    "",
    "### Per-Reflection Feedback",
    "",
    ...evaluation.reflectionFeedback.map(
      (rf) => `**Q${rf.questionIndex + 1}** (${rf.score}/10): ${rf.feedback}`,
    ),
    "",
    "---",
    "",
    "## Completion Output Quality",
    "",
    `**Average**: ${completionAvg.toFixed(1)}/10`,
    "",
    "| Dimension | Score |",
    "|-----------|-------|",
    `| Personalization | ${evaluation.completionScores.personalization}/10 |`,
    `| Actionability | ${evaluation.completionScores.actionability}/10 |`,
    `| Appropriate Boundaries | ${evaluation.completionScores.appropriateBoundaries}/10 |`,
    `| Empowerment Over Pressure | ${evaluation.completionScores.empowermentOverPressure}/10 |`,
    "",
    "### Completion Feedback",
    "",
    evaluation.completionFeedback,
    "",
    "---",
    "",
    "## Strengths",
    "",
    ...evaluation.strengths.map((s) => `- ✅ ${s}`),
    "",
    "## Areas for Improvement",
    "",
    ...evaluation.improvements.map((i) => `- ⚠️ ${i}`),
    "",
    "---",
    "",
    "## Prompt Engineering Suggestions",
    "",
    ...evaluation.promptSuggestions.map((p, idx) => `${idx + 1}. ${p}`),
    "",
    "---",
    "",
    "## Appendix: Generated Content",
    "",
    "### Reflections",
    "",
    ...answers.map((a, i) => `**Q${i + 1}**: "${a.reflection}"`),
    "",
    "### Personalized Brief",
    "",
    completionOutputs.personalizedBrief,
    "",
    "### First Session Guide",
    "",
    completionOutputs.firstSessionGuide,
    "",
    "### Pre-Therapy Experiments",
    "",
    ...completionOutputs.experiments.map((e, i) => `${i + 1}. ${e}`),
    "",
    "---",
    "",
    "*This evaluation was generated automatically for quality assurance purposes.*",
  ];

  return lines.join("\n");
}
