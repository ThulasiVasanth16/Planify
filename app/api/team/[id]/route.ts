import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getWorkspaceByUserId } from "@/lib/workspace";
import { removeMember, updateMemberRole } from "@/lib/team";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getWorkspaceByUserId(userId);
  if (!workspace) return NextResponse.json({ error: "No workspace" }, { status: 404 });

  const { id } = await params;
  const { role } = await req.json().catch(() => ({})) as { role?: string };

  if (role !== "admin" && role !== "member") {
    return NextResponse.json({ error: "role must be admin or member" }, { status: 400 });
  }

  try {
    const ok = await updateMemberRole(id, workspace.id, role);
    if (!ok) return NextResponse.json({ error: "Member not found" }, { status: 404 });
    return NextResponse.json({ id, role });
  } catch (err) {
    console.error(`PATCH /api/team/${id}`, err);
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getWorkspaceByUserId(userId);
  if (!workspace) return NextResponse.json({ error: "No workspace" }, { status: 404 });

  const { id } = await params;

  try {
    const ok = await removeMember(id, workspace.id);
    if (!ok) return NextResponse.json({ error: "Member not found" }, { status: 404 });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error(`DELETE /api/team/${id}`, err);
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }
}
