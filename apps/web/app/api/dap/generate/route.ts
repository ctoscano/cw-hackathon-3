import { SchemaDescriptions, buildDAPPrompt } from "@cw-hackathon/data";
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

    // Return prompt-only response
    // In environments where LLM calls work, this could be extended to call generateStructuredOutput
    return NextResponse.json({
      mode: "prompt-only",
      prompt: {
        system: prompt.system,
        user: prompt.user,
      },
      schema: SchemaDescriptions.DAPNote,
      metadata: {
        parts: prompt.metadata.parts,
        builtAt: prompt.metadata.builtAt.toISOString(),
      },
      message: "Prompt generated successfully. Copy to use with Claude.",
    });
  } catch (error) {
    console.error("Error generating DAP prompt:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate prompt" },
      { status: 500 },
    );
  }
}
