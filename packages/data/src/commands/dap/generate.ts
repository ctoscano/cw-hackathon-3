import { existsSync, readFileSync } from "node:fs";
import { defineCommand } from "citty";
import { formatTelemetry, generateStructuredOutput } from "../../lib/ai/client.js";
import { type DAPNote, DAPNoteSchema, SchemaDescriptions } from "../../lib/ai/schemas.js";
import { type PromptOutputFormat, buildDAPPrompt } from "../../lib/prompts/builder.js";
import { archiveDAPOutput, isRedisEnabled } from "../../lib/redis/archive.js";
import { getLatestOutputFile, saveJsonOutput, saveMarkdownOutput } from "../../lib/utils/file.js";

export const generateCommand = defineCommand({
  meta: {
    name: "generate",
    description: "Generate DAP notes from a therapist session description",
  },
  args: {
    input: {
      type: "string",
      description:
        "Path to input file (markdown) or direct session description. If not provided, uses latest synthetic session.",
      required: false,
    },
    outputDir: {
      type: "string",
      description: "Output directory for generated files",
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
    archive: {
      type: "boolean",
      description: "Archive DAP output to Redis for persistence and retrieval",
      default: false,
    },
  },
  async run({ args }) {
    const promptOnly = args.promptOnly;
    const outputFormat = args.outputFormat as PromptOutputFormat;

    console.log("\n📝 DAP Note Generator\n");

    // Get session description
    let sessionDescription: string;
    let inputSource: string;

    if (args.input) {
      if (existsSync(args.input)) {
        // Read from file
        sessionDescription = readFileSync(args.input, "utf-8");
        inputSource = args.input;
        console.log(`📄 Reading session from: ${inputSource}`);
      } else {
        // Treat as direct input
        sessionDescription = args.input;
        inputSource = "direct input";
        console.log("📝 Using direct session description");
      }
    } else {
      // Try to find the latest synthetic session
      const latestFile = getLatestOutputFile("synthetic", "md");
      if (latestFile) {
        sessionDescription = readFileSync(latestFile, "utf-8");
        inputSource = latestFile;
        console.log(`📄 Using latest synthetic session: ${inputSource}`);
      } else {
        console.error("❌ No input provided and no synthetic sessions found.");
        console.error("   Run `dap synthetic` first or provide --input");
        return { success: false, error: "No input provided" };
      }
    }

    // Extract just the narrative if we have structured markdown
    const narrative = extractNarrativeFromMarkdown(sessionDescription);

    console.log(`\n📊 Session length: ${narrative.length} characters`);

    // Build the prompt
    console.log("\n🔧 Building prompt...");
    const prompt = buildDAPPrompt(narrative, {
      outputFormat: promptOnly ? outputFormat : "markdown",
      schemaDescription: promptOnly ? SchemaDescriptions.DAPNote : undefined,
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
      console.log("\n   The expected output schema (DAPNote) is included in each artifact.");

      return {
        success: true,
        promptOnly: true,
        inputSource,
        prompt: {
          system: prompt.system,
          user: prompt.user,
          savedPaths: prompt.savedPaths,
        },
      };
    }

    // Generate DAP notes
    console.log("\n🤖 Generating DAP notes...");
    const result = await generateStructuredOutput({
      schema: DAPNoteSchema,
      prompt: prompt.user,
      system: prompt.system,
      config: {
        model: args.model as "opus" | "sonnet" | "haiku",
      },
    });

    // Save outputs
    const dapJsonPath = saveJsonOutput("dap-notes", "dap", result.data);
    const dapMarkdownPath = saveMarkdownOutput(
      "dap-notes",
      "dap",
      formatDAPAsMarkdown(result.data),
    );

    console.log("\n✅ DAP note generated successfully!\n");
    console.log("📁 Output files:");
    console.log(`   JSON: ${dapJsonPath}`);
    console.log(`   Markdown: ${dapMarkdownPath}`);
    if (prompt.savedPath) {
      console.log(`   Prompt: ${prompt.savedPath}`);
    }

    console.log("\n📊 Telemetry:");
    console.log(formatTelemetry(result.telemetry));

    // Archive to Redis if requested
    let sessionId: string | undefined;
    if (args.archive) {
      if (!isRedisEnabled()) {
        console.log("\n⚠️  Redis is disabled (REDIS_ENABLED=false)");
        console.log("   Skipping archival. Enable Redis to use --archive flag.");
      } else {
        console.log("\n💾 Archiving to Redis...");
        try {
          sessionId = crypto.randomUUID();

          // Convert DAP note to archive format
          const dapArchive = {
            disclosure: `${result.data.data.subjective}\n\n${result.data.data.objective}`,
            assessment: `${result.data.assessment.clinicalImpression}\n\n${result.data.assessment.progress}\n\n${result.data.assessment.riskAssessment}`,
            plan: `${result.data.plan.interventions.join("\n")}\n\n${result.data.plan.homework || ""}\n\n${result.data.plan.nextSession}`,
          };

          await archiveDAPOutput(sessionId, dapArchive, {
            model: args.model as string,
            tokensUsed: result.telemetry.totalTokens,
            generationTimeMs: result.telemetry.durationMs,
          });

          console.log(`   ✅ Archived with session ID: ${sessionId}`);
        } catch (error) {
          console.error(
            "   ❌ Archival failed:",
            error instanceof Error ? error.message : String(error),
          );
          console.log("   DAP note generation succeeded, but archival failed.");
        }
      }
    }

    // Print a preview
    console.log("\n--- DAP Note Preview ---\n");
    console.log(`📅 Session: ${result.data.metadata.sessionDate}`);
    console.log(`⏱️  Duration: ${result.data.metadata.sessionDuration}`);
    console.log(`📋 Type: ${result.data.metadata.sessionType}`);
    if (result.data.metadata.billingCode) {
      console.log(`💰 Billing: ${result.data.metadata.billingCode}`);
    }
    console.log("\n📝 Clinical Impression (excerpt):");
    console.log(`   ${result.data.assessment.clinicalImpression.slice(0, 200)}...`);

    return {
      success: true,
      inputSource,
      dapNote: result.data,
      sessionId,
      files: {
        json: dapJsonPath,
        markdown: dapMarkdownPath,
        prompt: prompt.savedPath,
      },
      telemetry: result.telemetry,
    };
  },
});

/**
 * Extract the narrative section from a structured markdown file
 */
function extractNarrativeFromMarkdown(content: string): string {
  // If it looks like our structured synthetic format, extract the narrative
  const narrativeMatch = content.match(
    /## Session Narrative\s*\n\s*>[^\n]*\n\s*\n([\s\S]*?)(?=\n---|\n##|$)/,
  );

  if (narrativeMatch) {
    return narrativeMatch[1].trim();
  }

  // Otherwise, return the whole content (might be plain text)
  return content;
}

/**
 * Format DAP note as readable markdown
 */
function formatDAPAsMarkdown(dap: DAPNote): string {
  const lines = [
    "# DAP Note",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Session Information",
    "",
    `- **Date**: ${dap.metadata.sessionDate}`,
    `- **Duration**: ${dap.metadata.sessionDuration}`,
    `- **Type**: ${dap.metadata.sessionType}`,
    dap.metadata.billingCode ? `- **Billing Code**: ${dap.metadata.billingCode}` : "",
    "",
    "---",
    "",
    "## DATA",
    "",
    "### Subjective",
    "",
    dap.data.subjective,
    "",
    "### Objective",
    "",
    dap.data.objective,
    "",
    "---",
    "",
    "## ASSESSMENT",
    "",
    "### Clinical Impression",
    "",
    dap.assessment.clinicalImpression,
    "",
    "### Progress",
    "",
    dap.assessment.progress,
    "",
    "### Risk Assessment",
    "",
    dap.assessment.riskAssessment,
    "",
    "---",
    "",
    "## PLAN",
    "",
    "### Interventions",
    "",
    ...dap.plan.interventions.map((i) => `- ${i}`),
    "",
    dap.plan.homework ? `### Homework\n\n${dap.plan.homework}\n` : "",
    "### Next Session",
    "",
    dap.plan.nextSession,
    "",
    dap.plan.referrals && dap.plan.referrals.length > 0
      ? `### Referrals\n\n${dap.plan.referrals.map((r) => `- ${r}`).join("\n")}\n`
      : "",
  ].filter(Boolean);

  return lines.join("\n");
}
