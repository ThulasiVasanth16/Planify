"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createTask } from "@/lib/tasks";
import type { TaskStatus, TaskPriority } from "@/lib/tasks";

export async function createTaskAction(formData: FormData) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const title = formData.get("title") as string;
  const status = (formData.get("status") as TaskStatus) || "todo";
  const priority = (formData.get("priority") as TaskPriority) || "medium";
  const projectId = formData.get("projectId") as string | null;
  const dueDate = formData.get("dueDate") as string | null;
  const description = formData.get("description") as string | null;
  const assigneeId = formData.get("assigneeId") as string | null;

  if (!title?.trim()) {
    throw new Error("Title is required");
  }

  const task = await createTask({
    userId,
    title: title.trim(),
    status,
    priority,
    projectId: projectId || null,
    dueDate: dueDate || null,
    description: description || null,
    assigneeId: assigneeId || null,
  });

  // Revalidate all relevant pages
  revalidatePath("/tasks");
  revalidatePath("/projects");
  revalidatePath("/dashboard");
  if (projectId) {
    revalidatePath(`/projects/${projectId}`);
  }

  return task;
}
