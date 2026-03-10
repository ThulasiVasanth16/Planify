import { auth, currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { getWorkspaceByUserId } from "@/lib/workspace";
import { getTeamMembers, getTeamTasks, getTeamStats } from "@/lib/team";
import { TeamWorkspace } from "./_components/team-workspace";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";

interface TeamPageProps {
  searchParams: Promise<{ assignee?: string }>;
}

export default async function TeamPage({ searchParams }: TeamPageProps) {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    return (
      <div className='flex h-full items-center justify-center'>
        <p className='text-muted-foreground'>
          Please sign in to view your team
        </p>
      </div>
    );
  }

  const workspace = await getWorkspaceByUserId(userId);

  // Show empty state instead of redirecting to onboarding
  if (!workspace) {
    return (
      <div className='flex h-full flex-col items-center justify-center gap-4'>
        <Users className='h-12 w-12 text-muted-foreground/50' />
        <div className='text-center'>
          <h2 className='text-lg font-semibold'>No workspace found</h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Create a workspace to start managing your team
          </p>
        </div>
        <Button asChild>
          <Link href='/onboarding'>Create Workspace</Link>
        </Button>
      </div>
    );
  }

  const params = await searchParams;
  const assigneeFilter = params.assignee ?? null;

  // Get owner profile from Clerk directly (same as Settings page)
  const ownerProfile = user
    ? {
        user_id: userId,
        display_name:
          user.firstName ||
          user.lastName ||
          user.emailAddresses[0]?.emailAddress?.split("@")[0] ||
          "User",
      }
    : null;

  const [members, tasks, stats] = await Promise.all([
    getTeamMembers(workspace.id),
    getTeamTasks(userId, workspace.id, assigneeFilter),
    getTeamStats(userId),
  ]);

  return (
    <TeamWorkspace
      workspace={workspace}
      ownerProfile={ownerProfile}
      members={members}
      initialTasks={tasks}
      stats={stats}
      isAdmin={true}
      activeAssignee={assigneeFilter}
    />
  );
}
