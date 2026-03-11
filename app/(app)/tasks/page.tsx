import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getTasksFiltered } from "@/lib/tasks";
import { getProjectsWithProgress } from "@/lib/projects";
import { TaskBoard } from "./_components/task-board";

// Disable caching to ensure fresh data on every request
export const revalidate = 0;

interface TasksPageProps {
  searchParams: Promise<{
    priority?: string;
    project?: string;
    sort?: string;
  }>;
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const params = await searchParams;

  const [tasks, projects] = await Promise.all([
    getTasksFiltered(userId, {
      priority: params.priority ?? null,
      project: params.project ?? null,
      sort: params.sort ?? null,
    }),
    getProjectsWithProgress(userId),
  ]);

  const projectOptions = projects.map((p) => ({ id: p.id, name: p.name }));

  return (
    <div className='flex h-full flex-col gap-4'>
      <div>
        <h1 className='text-2xl font-bold tracking-tight'>My Tasks</h1>
        <p className='text-sm text-muted-foreground'>
          {tasks.length} task{tasks.length !== 1 ? "s" : ""}
          {params.priority ? ` · ${params.priority} priority` : ""}
          {params.project ? " · filtered by project" : ""}
        </p>
      </div>

      <TaskBoard
        initialTasks={tasks}
        projects={projectOptions}
        activeFilters={params}
      />
    </div>
  );
}
