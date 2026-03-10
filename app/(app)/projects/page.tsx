import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getProjectsWithProgress } from "@/lib/projects";
import { ProjectGrid } from "./_components/project-grid";

export default async function ProjectsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const projects = await getProjectsWithProgress(userId);

  return (
    <div className="flex flex-col gap-6">
      <ProjectGrid initialProjects={projects} />
    </div>
  );
}
