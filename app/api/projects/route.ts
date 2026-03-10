import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getProjectsWithProgress, createProject } from "@/lib/projects";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const projects = await getProjectsWithProgress(userId);
    return NextResponse.json(projects);
  } catch (err) {
    console.error("GET /api/projects", err);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { name, description, color } = body as {
    name?: string;
    description?: string;
    color?: string;
  };

  if (!name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  try {
    const project = await createProject({
      userId,
      name: name.trim(),
      description: description?.trim() || null,
      color: color || "#6366f1",
    });
    return NextResponse.json(project, { status: 201 });
  } catch (err) {
    console.error("POST /api/projects", err);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
