import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getWorkspaceByUserId } from "@/lib/workspace";
import { sql } from "@/lib/db";
import {
  addProjectMember,
  removeProjectMember,
  getProjectMembers,
  getAvailableTeamMembers,
} from "@/lib/projects";

/**
 * GET: Get team members assigned to a project
 * POST: Add a team member to a project
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspace = await getWorkspaceByUserId(userId);
  if (!workspace) {
    return NextResponse.json({ error: "No workspace" }, { status: 404 });
  }

  const { id: projectId } = await params;

  // Verify user has access to this project (is owner)
  const [project] = await sql`
    SELECT id, user_id FROM projects 
    WHERE id = ${projectId} AND user_id = ${userId}
  `;

  if (!project) {
    return NextResponse.json(
      { error: "Project not found or access denied" },
      { status: 404 },
    );
  }

  try {
    const members = await getProjectMembers(projectId);
    const availableMembers = await getAvailableTeamMembers(
      workspace.id,
      projectId,
    );

    return NextResponse.json({
      assigned: members,
      available: availableMembers,
    });
  } catch (err) {
    console.error("GET /api/projects/[id]/members", err);
    return NextResponse.json(
      { error: "Failed to get members" },
      { status: 500 },
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspace = await getWorkspaceByUserId(userId);
  if (!workspace) {
    return NextResponse.json({ error: "No workspace" }, { status: 404 });
  }

  const { id: projectId } = await params;
  const body = await req.json().catch(() => ({}));
  const { memberId } = body as { memberId?: string };

  if (!memberId) {
    return NextResponse.json(
      { error: "memberId is required" },
      { status: 400 },
    );
  }

  // Verify user has access to this project (is owner)
  const [project] = await sql`
    SELECT id, user_id FROM projects 
    WHERE id = ${projectId} AND user_id = ${userId}
  `;

  if (!project) {
    return NextResponse.json(
      { error: "Project not found or access denied" },
      { status: 404 },
    );
  }

  try {
    const success = await addProjectMember({
      projectId,
      memberId,
    });

    if (!success) {
      return NextResponse.json(
        { error: "Failed to add member" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST /api/projects/[id]/members", err);
    return NextResponse.json(
      { error: "Failed to add member" },
      { status: 500 },
    );
  }
}

/**
 * DELETE: Remove a team member from a project
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: projectId } = await params;
  const { searchParams } = new URL(req.url);
  const memberId = searchParams.get("memberId");

  if (!memberId) {
    return NextResponse.json(
      { error: "memberId is required" },
      { status: 400 },
    );
  }

  // Verify user has access to this project (is owner)
  const [project] = await sql`
    SELECT id, user_id FROM projects 
    WHERE id = ${projectId} AND user_id = ${userId}
  `;

  if (!project) {
    return NextResponse.json(
      { error: "Project not found or access denied" },
      { status: 404 },
    );
  }

  try {
    const success = await removeProjectMember({
      projectId,
      memberId,
    });

    return NextResponse.json({ success });
  } catch (err) {
    console.error("DELETE /api/projects/[id]/members", err);
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 },
    );
  }
}
