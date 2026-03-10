import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { getProjectById } from "@/lib/projects";
import { getTasksFiltered } from "@/lib/tasks";
import { ProjectDetail } from "./_components/project-detail";

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string }>;
}

export default async function ProjectDetailPage({ params, searchParams }: ProjectDetailPageProps) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { id } = await params;
  const { view } = await searchParams;

  const [project, tasks] = await Promise.all([
    getProjectById(id, userId),
    getTasksFiltered(userId, { project: id }),
  ]);

  if (!project) notFound();

  return (
    <ProjectDetail
      project={project}
      initialTasks={tasks}
      view={(view === "list" ? "list" : "kanban") as "kanban" | "list"}
    />
  );
}
