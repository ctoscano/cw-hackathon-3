import { isFeatureEnabled } from "@/lib/feature-flags";
import { getDashboardStats } from "@/lib/redis/ops";
import { NextResponse } from "next/server";

export async function GET() {
  // Check feature flag
  if (!isFeatureEnabled("ops_page")) {
    return NextResponse.json({ error: "Feature not enabled" }, { status: 404 });
  }

  try {
    const stats = await getDashboardStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
