import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { getTaskById } from "@/lib/tasks";
import { getProjectsWithProgress } from "@/lib/projects";
import { TaskDetail } from "./_components/task-detail";

interface TaskDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { id } = await params;

  const [task, projects] = await Promise.all([
    getTaskById(id, userId),
    getProjectsWithProgress(userId),
  ]);

  if (!task) notFound();

  const projectOptions = projects.map((p) => ({ id: p.id, name: p.name }));

  return <TaskDetail task={task} projects={projectOptions} />;
}
