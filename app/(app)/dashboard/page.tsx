import { auth, currentUser } from "@clerk/nextjs/server";
import { getDashboardStats, getPriorityTasks } from "@/lib/tasks";
import { getProjectsWithProgress } from "@/lib/projects";
import { StatCards } from "./_components/stat-cards";
import { PriorityQueue } from "./_components/priority-queue";
import { ProjectProgress } from "./_components/project-progress";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default async function DashboardPage() {
  const { userId } = await auth();

  // Auth is handled by middleware - if no userId, show loading while session loads
  if (!userId) {
    return (
      <div className='flex h-full items-center justify-center'>
        <div className='flex flex-col items-center gap-3'>
          <div className='h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent' />
          <p className='text-sm text-muted-foreground'>Loading session...</p>
        </div>
      </div>
    );
  }

  // Get full user object for displaying name
  const user = await currentUser();
  const firstName =
    user?.firstName ||
    user?.emailAddresses[0]?.emailAddress?.split("@")[0] ||
    "User";

  // Fetch all dashboard data in parallel
  const [stats, priorityTasks, projects] = await Promise.all([
    getDashboardStats(userId),
    getPriorityTasks(userId),
    getProjectsWithProgress(userId),
  ]);

  const today = new Date();

  return (
    <div className='space-y-6'>
      {/* ── Greeting header ── */}
      <div>
        <h1 className='text-2xl font-bold tracking-tight'>
          {getGreeting()}, {firstName} 👋
        </h1>
        <p className='mt-1 text-sm text-muted-foreground'>
          {formatDate(today)}
          {stats.due_this_week > 0 && (
            <>
              {" "}
              &middot;{" "}
              <span className='font-medium text-foreground'>
                {stats.due_this_week} task{stats.due_this_week !== 1 ? "s" : ""}
              </span>{" "}
              due this week
            </>
          )}
        </p>
      </div>

      {/* ── Summary stat cards ── */}
      <StatCards stats={stats} />

      {/* ── Priority Queue + Project Progress ── */}
      <div className='grid gap-6 lg:grid-cols-2'>
        <PriorityQueue initialTasks={priorityTasks} />
        <ProjectProgress projects={projects} />
      </div>
    </div>
  );
}
