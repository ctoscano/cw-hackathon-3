import {
  DAPNoteSchema,
  SchemaDescriptions,
  archiveDAPOutput,
  buildDAPPrompt,
  generateStructuredOutput,
} from "@cw-hackathon/data";
import { nanoid } from "nanoid";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionDescription } = body;

    if (!sessionDescription || typeof sessionDescription !== "string") {
      return NextResponse.json(
        { error: "sessionDescription is required and must be a string" },
        { status: 400 },
      );
    }

    if (sessionDescription.trim().length < 50) {
      return NextResponse.json(
        { error: "Please provide a more detailed session description (at least 50 characters)" },
        { status: 400 },
      );
    }

    // Build the prompt using the same logic as the CLI
    // saveToFile: false since we're in the web context
    const prompt = buildDAPPrompt(sessionDescription, {
      saveToFile: false,
      schemaDescription: SchemaDescriptions.DAPNote,
    });

    // Generate DAP note using LLM
    const result = await generateStructuredOutput({
      schema: DAPNoteSchema,
      prompt: prompt.user,
      system: prompt.system,
      config: { model: "sonnet" },
    });

    // Archive to Redis for /ops dashboard
    // Convert nested DAP structure to flat format expected by archive
    const sessionId = nanoid();
    const flattenedDAP = {
      disclosure: `**Subjective:**\n\n${result.data.data.subjective}\n\n**Objective:**\n\n${result.data.data.objective}`,
      assessment: `**Clinical Impression:**\n\n${result.data.assessment.clinicalImpression}\n\n**Progress:**\n\n${result.data.assessment.progress}\n\n**Risk Assessment:**\n\n${result.data.assessment.riskAssessment}`,
      plan: `**Interventions:**\n\n${result.data.plan.interventions.map((i) => `- ${i}`).join("\n")}\n\n**Next Session:**\n\n${result.data.plan.nextSession}${result.data.plan.homework ? `\n\n**Homework:**\n\n${result.data.plan.homework}` : ""}${result.data.plan.referrals?.length ? `\n\n**Referrals:**\n\n${result.data.plan.referrals.map((r) => `- ${r}`).join("\n")}` : ""}`,
    };

    await archiveDAPOutput(sessionId, flattenedDAP, {
      model: result.telemetry.model,
      tokensUsed: result.telemetry.totalTokens,
      generationTimeMs: result.telemetry.durationMs,
    });

    // Return generated DAP note with metadata
    return NextResponse.json({
      mode: "generated",
      sessionId,
      dapNote: result.data,
      metadata: {
        tokensUsed: {
          inputTokens: result.telemetry.promptTokens,
          outputTokens: result.telemetry.completionTokens,
          totalTokens: result.telemetry.totalTokens,
        },
        executionTime: `${(result.telemetry.durationMs / 1000).toFixed(2)}s`,
        model: result.telemetry.model,
        builtAt: prompt.metadata.builtAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error generating DAP prompt:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate prompt" },
      { status: 500 },
    );
  }
}
