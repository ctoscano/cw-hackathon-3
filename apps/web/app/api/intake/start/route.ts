import { getAllQuestions, getFirstQuestion, getIntakeMetadata } from "@cw-hackathon/data";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const intakeType = searchParams.get("type") || "therapy_readiness";

    // Get intake metadata
    const metadata = getIntakeMetadata(intakeType);
    if (!metadata) {
      return NextResponse.json({ error: `Unknown intake type: ${intakeType}` }, { status: 404 });
    }

    // Get the first question
    const firstQuestion = getFirstQuestion(intakeType);
    if (!firstQuestion) {
      return NextResponse.json({ error: "No questions found for this intake" }, { status: 500 });
    }

    // Get all questions for prefetching (enables showing next question immediately)
    const allQuestions = getAllQuestions(intakeType);

    return NextResponse.json({
      intakeType,
      name: metadata.name,
      description: metadata.description,
      totalSteps: metadata.totalSteps,
      firstQuestion: firstQuestion.question,
      allQuestions: allQuestions || [],
    });
  } catch (error) {
    console.error("Error starting intake:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to start intake" },
      { status: 500 },
    );
  }
}
