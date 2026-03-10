import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { archiveProject, deleteProject } from "@/lib/projects";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { action } = body as { action?: string };

  if (action === "archive") {
    try {
      const ok = await archiveProject(id, userId);
      if (!ok) return NextResponse.json({ error: "Project not found" }, { status: 404 });
      return NextResponse.json({ id, status: "archived" });
    } catch (err) {
      console.error(`PATCH /api/projects/${id}`, err);
      return NextResponse.json({ error: "Failed to archive project" }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const ok = await deleteProject(id, userId);
    if (!ok) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error(`DELETE /api/projects/${id}`, err);
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}
