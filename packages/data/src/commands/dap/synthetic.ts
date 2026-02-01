import { defineCommand } from "citty";
import { generateStructuredOutput } from "../../lib/ai/client.js";
import { TherapistSessionInputSchema } from "../../lib/ai/schemas.js";
import { buildSyntheticPrompt } from "../../lib/prompts/builder.js";
import { saveJsonOutput, saveMarkdownOutput } from "../../lib/utils/file.js";

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
  },
  async run({ args }) {
    const count = Number.parseInt(args.count, 10);

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
