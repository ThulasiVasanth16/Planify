import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { updateTaskStatus, updateTask, deleteTask } from "@/lib/tasks";
import type { TaskStatus, TaskPriority } from "@/lib/tasks";

const VALID_STATUSES: TaskStatus[] = ["todo", "in_progress", "in_review", "done"];
const VALID_PRIORITIES: TaskPriority[] = ["low", "medium", "high"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  // Full update (from Task Detail page): body contains title, status, priority, etc.
  if (body.title !== undefined) {
    const { title, description, notes, status, priority, projectId, dueDate } = body as {
      title: string;
      description?: string | null;
      notes?: string | null;
      status?: string;
      priority?: string;
      projectId?: string | null;
      dueDate?: string | null;
    };

    if (!title?.trim()) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }
    if (status && !VALID_STATUSES.includes(status as TaskStatus)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    if (priority && !VALID_PRIORITIES.includes(priority as TaskPriority)) {
      return NextResponse.json({ error: "Invalid priority" }, { status: 400 });
    }

    try {
      const task = await updateTask(id, userId, {
        title: title.trim(),
        description: description ?? null,
        notes: notes ?? null,
        status: (status as TaskStatus) ?? "todo",
        priority: (priority as TaskPriority) ?? "medium",
        projectId: projectId ?? null,
        dueDate: dueDate ?? null,
      });
      if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
      return NextResponse.json(task);
    } catch (err) {
      console.error(`PATCH /api/tasks/${id} (full)`, err);
      return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
    }
  }

  // Status-only update (from TaskBoard optimistic toggle)
  const { status } = body as { status?: string };
  if (!status || !VALID_STATUSES.includes(status as TaskStatus)) {
    return NextResponse.json(
      { error: `status must be one of: ${VALID_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const updated = await updateTaskStatus(id, userId, status);
    if (!updated) return NextResponse.json({ error: "Task not found" }, { status: 404 });
    return NextResponse.json({ id, status });
  } catch (err) {
    console.error(`PATCH /api/tasks/${id} (status)`, err);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const deleted = await deleteTask(id, userId);
    if (!deleted) return NextResponse.json({ error: "Task not found" }, { status: 404 });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error(`DELETE /api/tasks/${id}`, err);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
