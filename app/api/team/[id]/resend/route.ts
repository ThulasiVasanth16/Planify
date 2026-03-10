import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getWorkspaceByUserId } from "@/lib/workspace";
import { sql } from "@/lib/db";

/** Mark a pending invite as resent (updates created_at to now, re-triggering the invite window). */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getWorkspaceByUserId(userId);
  if (!workspace) return NextResponse.json({ error: "No workspace" }, { status: 404 });

  const { id } = await params;

  try {
    const result = await sql`
      UPDATE team_members SET created_at = now()
      WHERE id = ${id} AND workspace_id = ${workspace.id} AND status = 'pending'
      RETURNING id, created_at::text
    `;
    if (result.length === 0) {
      return NextResponse.json({ error: "Pending invite not found" }, { status: 404 });
    }
    return NextResponse.json({ id, resent: true });
  } catch (err) {
    console.error(`POST /api/team/${id}/resend`, err);
    return NextResponse.json({ error: "Failed to resend invitation" }, { status: 500 });
  }
}
