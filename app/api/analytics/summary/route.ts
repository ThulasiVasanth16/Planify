import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getAnalyticsSummary } from "@/lib/analytics";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const summary = await getAnalyticsSummary(userId);
    return NextResponse.json(summary);
  } catch (err) {
    console.error("GET /api/analytics/summary", err);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
