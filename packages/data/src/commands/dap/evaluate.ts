import { existsSync, readFileSync } from "node:fs";
import { defineCommand } from "citty";
import { formatTelemetry, generateStructuredOutput } from "../../lib/ai/client.js";
import {
  type EvaluationResult,
  EvaluationResultSchema,
  SchemaDescriptions,
} from "../../lib/ai/schemas.js";
import { type PromptOutputFormat, buildEvaluationPrompt } from "../../lib/prompts/builder.js";
import { getLatestOutputFile, saveJsonOutput, saveMarkdownOutput } from "../../lib/utils/file.js";

export const evaluateCommand = defineCommand({
  meta: {
    name: "evaluate",
    description: "Evaluate the quality of generated DAP notes and suggest improvements",
  },
  args: {
    dapInput: {
      type: "string",
      description: "Path to DAP note JSON file. If not provided, uses latest.",
      required: false,
    },
    sessionInput: {
      type: "string",
      description: "Path to original session file. If not provided, uses latest synthetic.",
      required: false,
    },
    model: {
      type: "string",
      description: "AI model to use: opus, sonnet, haiku",
      default: "haiku",
    },
    promptOnly: {
      type: "boolean",
      description:
        "Build and save prompt artifacts without calling the LLM. Use for prompt development and inspection.",
      alias: "p",
      default: false,
    },
    outputFormat: {
      type: "string",
      description: "Prompt output format: markdown, json, copyable, all",
      default: "all",
    },
  },
  async run({ args }) {
    const promptOnly = args.promptOnly;
    const outputFormat = args.outputFormat as PromptOutputFormat;

    console.log("\n🔍 DAP Note Quality Evaluator\n");

    // Get DAP note
    let dapContent: string;
    let dapSource: string;

    if (args.dapInput && existsSync(args.dapInput)) {
      dapContent = readFileSync(args.dapInput, "utf-8");
      dapSource = args.dapInput;
    } else {
      const latestDap = getLatestOutputFile("dap-notes", "json");
      if (latestDap) {
        dapContent = readFileSync(latestDap, "utf-8");
        dapSource = latestDap;
      } else {
        console.error("❌ No DAP note found. Run `dap generate` first.");
        return { success: false, error: "No DAP note found" };
      }
    }
    console.log(`📄 DAP Note: ${dapSource}`);

    // Get session input
    let sessionContent: string;
    let sessionSource: string;

    if (args.sessionInput && existsSync(args.sessionInput)) {
      sessionContent = readFileSync(args.sessionInput, "utf-8");
      sessionSource = args.sessionInput;
    } else {
      const latestSession = getLatestOutputFile("synthetic", "md");
      if (latestSession) {
        sessionContent = readFileSync(latestSession, "utf-8");
        sessionSource = latestSession;
      } else {
        console.error(
          "❌ No session input found. Run `dap synthetic` first or provide --session-input.",
        );
        return { success: false, error: "No session input found" };
      }
    }
    console.log(`📄 Session: ${sessionSource}`);

    // Build evaluation prompt
    console.log("\n🔧 Building evaluation prompt...");
    const prompt = buildEvaluationPrompt({
      sessionInput: sessionContent,
      dapOutput: dapContent,
      outputFormat: promptOnly ? outputFormat : "markdown",
      schemaDescription: promptOnly ? SchemaDescriptions.EvaluationResult : undefined,
    });

    if (promptOnly) {
      console.log("\n✅ Prompt artifacts created (no LLM call):");
      if (prompt.savedPaths?.markdown) {
        console.log(`   Markdown: ${prompt.savedPaths.markdown}`);
      }
      if (prompt.savedPaths?.json) {
        console.log(`   JSON: ${prompt.savedPaths.json}`);
      }
      if (prompt.savedPaths?.copyable) {
        console.log(`   Copyable: ${prompt.savedPaths.copyable}`);
      }

      console.log("\n💡 Usage:");
      console.log("   - Review the markdown file to understand prompt structure");
      console.log("   - Copy the 'copyable' file contents directly into Claude Code Web");
      console.log("   - Use the JSON file for programmatic prompt access");
      console.log(
        "\n   The expected output schema (EvaluationResult) is included in each artifact.",
      );

      return {
        success: true,
        promptOnly: true,
        dapSource,
        sessionSource,
        prompt: {
          system: prompt.system,
          user: prompt.user,
          savedPaths: prompt.savedPaths,
        },
      };
    }

    // Run evaluation
    console.log("\n🤖 Running quality evaluation...");
    const result = await generateStructuredOutput({
      schema: EvaluationResultSchema,
      prompt: prompt.user,
      system: prompt.system,
      config: {
        model: args.model as "opus" | "sonnet" | "haiku",
      },
    });

    // Save results
    const evalJsonPath = saveJsonOutput("evaluations", "eval", result.data);
    const evalMarkdownPath = saveMarkdownOutput(
      "evaluations",
      "eval",
      formatEvaluationAsMarkdown(result.data, dapSource, sessionSource),
    );

    console.log("\n✅ Evaluation complete!\n");
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
        prompt: prompt.savedPath,
      },
      telemetry: result.telemetry,
    };
  },
});

function printEvaluationSummary(eval_: EvaluationResult): void {
  console.log("--- Evaluation Summary ---\n");

  console.log(`📊 Overall Score: ${eval_.overallScore}/10\n`);

  console.log("📈 Dimension Scores:");
  console.log(`   Completeness:      ${eval_.dimensions.completeness}/10`);
  console.log(`   Accuracy:          ${eval_.dimensions.accuracy}/10`);
  console.log(`   Clinical Language: ${eval_.dimensions.clinicalAppropriate}/10`);
  console.log(`   Insurance Ready:   ${eval_.dimensions.insuranceCompliance}/10`);
  console.log(`   Actionability:     ${eval_.dimensions.actionability}/10`);

  console.log("\n✅ Strengths:");
  for (const s of eval_.strengths) {
    console.log(`   • ${s}`);
  }

  console.log("\n⚠️  Areas for Improvement:");
  for (const i of eval_.improvements) {
    console.log(`   • ${i}`);
  }

  console.log("\n💡 Prompt Suggestions:");
  for (const p of eval_.promptSuggestions) {
    console.log(`   • ${p}`);
  }
}

function formatEvaluationAsMarkdown(
  eval_: EvaluationResult,
  dapSource: string,
  sessionSource: string,
): string {
  const lines = [
    "# DAP Note Quality Evaluation",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Sources",
    "",
    `- **DAP Note**: ${dapSource}`,
    `- **Session Input**: ${sessionSource}`,
    "",
    "---",
    "",
    "## Overall Score",
    "",
    `# ${eval_.overallScore}/10`,
    "",
    "## Dimension Scores",
    "",
    "| Dimension | Score | Description |",
    "|-----------|-------|-------------|",
    `| Completeness | ${eval_.dimensions.completeness}/10 | Are all sections complete? |`,
    `| Accuracy | ${eval_.dimensions.accuracy}/10 | Does it reflect the input? |`,
    `| Clinical Language | ${eval_.dimensions.clinicalAppropriate}/10 | Is language professional? |`,
    `| Insurance Compliance | ${eval_.dimensions.insuranceCompliance}/10 | Would it pass audit? |`,
    `| Actionability | ${eval_.dimensions.actionability}/10 | Is the plan clear? |`,
    "",
    "---",
    "",
    "## Strengths",
    "",
    ...eval_.strengths.map((s) => `- ✅ ${s}`),
    "",
    "## Areas for Improvement",
    "",
    ...eval_.improvements.map((i) => `- ⚠️ ${i}`),
    "",
    "---",
    "",
    "## Prompt Engineering Suggestions",
    "",
    "The following changes to the system prompt could improve future generations:",
    "",
    ...eval_.promptSuggestions.map((p, idx) => `${idx + 1}. ${p}`),
    "",
    "---",
    "",
    "*This evaluation was generated automatically for quality assurance purposes.*",
  ];

  return lines.join("\n");
}
