import {
  DAPNoteSchema,
  SchemaDescriptions,
  buildDAPPrompt,
  generateStructuredOutput,
} from "@cw-hackathon/data";
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

    // Return generated DAP note with metadata
    return NextResponse.json({
      mode: "generated",
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
