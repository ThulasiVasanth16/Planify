import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import {
  getWorkspaceByUserId,
  getWorkspaceOwnerProfile,
} from "@/lib/workspace";
import { sql } from "@/lib/db";
import { sendReminderEmail } from "@/lib/email";

/** Mark a pending invite as resent (updates created_at to now, re-triggering the invite window). */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getWorkspaceByUserId(userId);
  if (!workspace)
    return NextResponse.json({ error: "No workspace" }, { status: 404 });

  const { id } = await params;

  try {
    // First get the member's email
    const [memberResult] = await sql`
      SELECT tm.email, tm.workspace_id
      FROM team_members tm
      WHERE tm.id = ${id} AND tm.workspace_id = ${workspace.id} AND tm.status = 'pending'
    `;

    if (!memberResult) {
      return NextResponse.json(
        { error: "Pending invite not found" },
        { status: 404 },
      );
    }

    // Update the invite timestamp
    const result = await sql`
      UPDATE team_members SET created_at = now()
      WHERE id = ${id} AND workspace_id = ${workspace.id} AND status = 'pending'
      RETURNING id, created_at::text
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Pending invite not found" },
        { status: 404 },
      );
    }

    // Get inviter's name and workspace name for the email
    const ownerProfile = await getWorkspaceOwnerProfile(userId);
    const inviterName = ownerProfile?.display_name || "Team Admin";
    const workspaceName = workspace.name;

    // Send reminder email
    const emailResult = await sendReminderEmail({
      email: memberResult.email as string,
      inviterName,
      workspaceName,
    });

    if (!emailResult.success) {
      console.error("Failed to send reminder email:", emailResult.error);
    }

    return NextResponse.json({ id, resent: true });
  } catch (err) {
    console.error(`POST /api/team/${id}/resend`, err);
    return NextResponse.json(
      { error: "Failed to resend invitation" },
      { status: 500 },
    );
  }
}
