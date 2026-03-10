import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getTasksFiltered, createTask } from "@/lib/tasks";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const filters = {
    priority: searchParams.get("priority"),
    project:  searchParams.get("project"),
    sort:     searchParams.get("sort"),
  };

  try {
    const tasks = await getTasksFiltered(userId, filters);
    return NextResponse.json(tasks);
  } catch (err) {
    console.error("GET /api/tasks", err);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { title, status, priority, projectId, dueDate } = body as {
    title?: string;
    status?: string;
    priority?: string;
    projectId?: string;
    dueDate?: string;
  };

  if (!title?.trim()) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  try {
    const task = await createTask({
      userId,
      title: title.trim(),
      status: (status as "todo" | "in_progress" | "in_review" | "done") ?? "todo",
      priority: (priority as "low" | "medium" | "high") ?? "medium",
      projectId: projectId ?? null,
      dueDate: dueDate ?? null,
    });
    return NextResponse.json(task, { status: 201 });
  } catch (err) {
    console.error("POST /api/tasks", err);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
