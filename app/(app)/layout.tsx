import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { CreateTaskProvider } from "@/components/providers/create-task-provider";
import { getProjectNames } from "@/lib/projects";
import { getWorkspaceByUserId } from "@/lib/workspace";
import { getTeamMembers } from "@/lib/team";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const projects = userId ? await getProjectNames(userId) : [];
  const workspace = await getWorkspaceByUserId(userId);
  const teamMembers = workspace ? await getTeamMembers(workspace.id) : [];

  return (
    <CreateTaskProvider projects={projects} teamMembers={teamMembers}>
      <div className='flex h-screen overflow-hidden'>
        <Sidebar />
        <div className='flex flex-1 flex-col overflow-hidden'>
          <AppHeader title='Planify' />
          <main className='flex-1 overflow-y-auto overflow-x-hidden bg-background p-4 lg:p-6'>
            {children}
          </main>
        </div>
      </div>
    </CreateTaskProvider>
  );
}
