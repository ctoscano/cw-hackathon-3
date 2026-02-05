import { isFeatureEnabled } from "@/lib/feature-flags";
import { getSessionData } from "@/lib/redis/intake";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  // Feature flag check
  if (!isFeatureEnabled("ops_page")) {
    return NextResponse.json({ error: "Feature not enabled" }, { status: 404 });
  }

  try {
    const { sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    const sessionData = await getSessionData(sessionId);

    if (!sessionData) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json(sessionData);
  } catch (error) {
    console.error("Error fetching intake session:", error);
    return NextResponse.json({ error: "Failed to fetch session" }, { status: 500 });
  }
}
