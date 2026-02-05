import { isFeatureEnabled } from "@/lib/feature-flags";
import { listArchivedIntakeSessions } from "@/lib/redis/ops";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Feature flag check
  if (!isFeatureEnabled("ops_page")) {
    return NextResponse.json({ error: "Feature not enabled" }, { status: 404 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const page = Number.parseInt(searchParams.get("page") || "1", 10);
    const search = searchParams.get("search") || undefined;

    if (Number.isNaN(page) || page < 1) {
      return NextResponse.json({ error: "Invalid page parameter" }, { status: 400 });
    }

    const result = await listArchivedIntakeSessions(page, 20, search);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching intake sessions:", error);
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }
}
