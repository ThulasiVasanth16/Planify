import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getProjectNames } from "@/lib/projects";
import { NewTaskPageClient } from "./_components/new-task-page-client";

export default async function NewTaskPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const projects = await getProjectNames(userId);

  return <NewTaskPageClient projects={projects} />;
}
