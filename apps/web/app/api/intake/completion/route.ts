import { generateCompletionOutputs, type IntakeAnswer } from "@cw-hackathon/data";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Schema for completion request
const CompletionRequestSchema = z.object({
  intakeType: z.string(),
  answers: z.array(
    z.object({
      questionId: z.string(),
      questionPrompt: z.string(),
      answer: z.union([z.string(), z.array(z.string())]),
      reflection: z.string(),
    }),
  ),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const parseResult = CompletionRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request",
          details: parseResult.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { answers } = parseResult.data;

    // Validate we have at least some answers
    if (answers.length === 0) {
      return NextResponse.json({ error: "No answers provided" }, { status: 400 });
    }

    // Generate completion outputs
    const result = await generateCompletionOutputs(answers as IntakeAnswer[]);

    return NextResponse.json({
      completionOutputs: result.data,
    });
  } catch (error) {
    console.error("Error generating completion:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate completion" },
      { status: 500 },
    );
  }
}
