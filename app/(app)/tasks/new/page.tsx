import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getProjectNames } from "@/lib/projects";
import { getWorkspaceByUserId } from "@/lib/workspace";
import { getTeamMembers } from "@/lib/team";
import { NewTaskPageClient } from "./_components/new-task-page-client";

export default async function NewTaskPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const projects = await getProjectNames(userId);
  const workspace = await getWorkspaceByUserId(userId);
  const teamMembers = workspace ? await getTeamMembers(workspace.id) : [];

  return <NewTaskPageClient projects={projects} teamMembers={teamMembers} />;
}
