import { defineCommand } from "citty";
import { generateStructuredOutput } from "../../lib/ai/client";
import { SchemaDescriptions, TherapistSessionInputSchema } from "../../lib/ai/schemas";
import { type PromptOutputFormat, buildSyntheticPrompt } from "../../lib/prompts/builder";
import { saveJsonOutput, saveMarkdownOutput } from "../../lib/utils/file";

export const syntheticCommand = defineCommand({
  meta: {
    name: "synthetic",
    description: "Generate synthetic therapist session descriptions for testing",
  },
  args: {
    count: {
      type: "string",
      description: "Number of synthetic sessions to generate",
      default: "1",
    },
    scenario: {
      type: "string",
      description:
        "Type of scenario: depression, anxiety, trauma, relationship, grief, substance, mixed",
      required: false,
    },
    modality: {
      type: "string",
      description:
        "Therapeutic modality: cbt, dbt, psychodynamic, person-centered, integrative, mixed",
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
    const count = Number.parseInt(args.count, 10);
    const promptOnly = args.promptOnly;
    const outputFormat = args.outputFormat as PromptOutputFormat;

    if (promptOnly) {
      console.log("\n📋 Building prompt artifacts (no LLM call)...\n");

      // Build the prompt with all formats
      const prompt = buildSyntheticPrompt({
        scenarioType: args.scenario,
        therapeuticModality: args.modality,
        outputFormat,
        schemaDescription: SchemaDescriptions.TherapistSessionInput,
      });

      console.log("\n✅ Prompt artifacts created:");
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
      console.log("\n   The expected output schema is included in each artifact.");

      return {
        success: true,
        promptOnly: true,
        prompt: {
          system: prompt.system,
          user: prompt.user,
          savedPaths: prompt.savedPaths,
        },
      };
    }

    console.log(`\n🧪 Generating ${count} synthetic therapy session(s)...\n`);

    const results: Array<{
      index: number;
      markdownPath: string;
      jsonPath: string;
    }> = [];

    for (let i = 0; i < count; i++) {
      console.log(`\n--- Session ${i + 1} of ${count} ---\n`);

      // Build the prompt
      const prompt = buildSyntheticPrompt({
        scenarioType: args.scenario,
        therapeuticModality: args.modality,
      });

      // Generate the synthetic session
      const result = await generateStructuredOutput({
        schema: TherapistSessionInputSchema,
        prompt: prompt.system,
        system:
          "You are a helpful assistant that generates realistic therapy session narratives. Output valid JSON matching the schema.",
        config: {
          model: args.model as "opus" | "sonnet" | "haiku",
        },
      });

      // Format as markdown for easy reading
      const markdown = formatSessionAsMarkdown(result.data, i + 1);
      const markdownPath = saveMarkdownOutput(
        "synthetic",
        `session-${String(i + 1).padStart(3, "0")}`,
        markdown,
      );

      // Also save as JSON for programmatic use
      const jsonPath = saveJsonOutput(
        "synthetic",
        `session-${String(i + 1).padStart(3, "0")}`,
        result.data,
      );

      results.push({
        index: i + 1,
        markdownPath,
        jsonPath,
      });

      console.log(`✅ Saved session ${i + 1}:`);
      console.log(`   Markdown: ${markdownPath}`);
      console.log(`   JSON: ${jsonPath}`);
    }

    console.log(`\n✨ Generated ${count} synthetic session(s)\n`);

    // Print summary
    console.log("Files created:");
    for (const r of results) {
      console.log(`  ${r.index}. ${r.markdownPath}`);
    }

    return {
      success: true,
      count,
      files: results,
    };
  },
});

function formatSessionAsMarkdown(
  session: import("../../lib/ai/schemas.js").TherapistSessionInput,
  index: number,
): string {
  const lines = [
    `# Synthetic Therapy Session ${index}`,
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Scenario",
    "",
    session.scenario,
    "",
    "## Therapeutic Approach",
    "",
    session.therapeuticApproach,
    "",
    "## Patient Presentation",
    "",
    session.patientPresentation,
    "",
    "## Key Themes",
    "",
    ...session.keyThemes.map((t) => `- ${t}`),
    "",
    "## Interventions Used",
    "",
    ...session.interventions.map((i) => `- ${i}`),
    "",
    "## Session Narrative",
    "",
    "> What the therapist would say when describing this session:",
    "",
    session.sessionNarrative,
    "",
    "---",
    "",
    "*This is synthetic data generated for testing purposes.*",
  ];

  return lines.join("\n");
}
