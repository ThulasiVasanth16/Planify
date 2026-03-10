import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getWorkspaceByUserId } from "@/lib/workspace";
import { getTeamMembers } from "@/lib/team";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getWorkspaceByUserId(userId);
  if (!workspace) return NextResponse.json({ error: "No workspace found" }, { status: 404 });

  try {
    const members = await getTeamMembers(workspace.id);
    return NextResponse.json(members);
  } catch (err) {
    console.error("GET /api/team", err);
    return NextResponse.json({ error: "Failed to fetch team" }, { status: 500 });
  }
}
