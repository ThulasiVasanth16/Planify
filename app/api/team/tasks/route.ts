import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getWorkspaceByUserId } from "@/lib/workspace";
import { getTeamTasks } from "@/lib/team";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getWorkspaceByUserId(userId);
  if (!workspace) return NextResponse.json({ error: "No workspace found" }, { status: 404 });

  const assigneeId = req.nextUrl.searchParams.get("assignee");

  try {
    const tasks = await getTeamTasks(userId, workspace.id, assigneeId);
    return NextResponse.json(tasks);
  } catch (err) {
    console.error("GET /api/team/tasks", err);
    return NextResponse.json({ error: "Failed to fetch team tasks" }, { status: 500 });
  }
}
