import { IntakeStepRequestSchema, processIntakeStep } from "@cw-hackathon/data/web";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const parseResult = IntakeStepRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request",
          details: parseResult.error.flatten(),
        },
        { status: 400 },
      );
    }

    const stepRequest = parseResult.data;

    // Validate answer is not empty
    const answer = stepRequest.currentAnswer;
    if (Array.isArray(answer)) {
      if (answer.length === 0) {
        return NextResponse.json({ error: "Please select at least one option" }, { status: 400 });
      }
    } else {
      if (answer.trim().length === 0) {
        return NextResponse.json({ error: "Please provide an answer" }, { status: 400 });
      }
    }

    // Process the intake step
    const response = await processIntakeStep(stepRequest);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error processing intake step:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process intake step" },
      { status: 500 },
    );
  }
}
