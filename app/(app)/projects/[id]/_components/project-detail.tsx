"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight, LayoutGrid, List } from "lucide-react";
import { KanbanView } from "./kanban-view";
import { ListView } from "./list-view";
import { cn } from "@/lib/utils";
import type { Project } from "@/lib/projects";
import type { Task, TaskStatus, TaskPriority } from "@/lib/tasks";

interface ProjectDetailProps {
  project: Project;
  initialTasks: Task[];
  view: "kanban" | "list";
}

type OptimisticTaskAction =
  | { type: "toggle"; id: string; status: TaskStatus }
  | { type: "delete"; id: string }
  | { type: "add"; task: Task };

function applyAction(tasks: Task[], action: OptimisticTaskAction): Task[] {
  switch (action.type) {
    case "toggle":
      return tasks.map((t) =>
        t.id === action.id ? { ...t, status: action.status } : t,
      );
    case "delete":
      return tasks.filter((t) => t.id !== action.id);
    case "add":
      return [action.task, ...tasks];
  }
}

export function ProjectDetail({
  project,
  initialTasks,
  view,
}: ProjectDetailProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [tasks, dispatch] = useOptimistic<Task[], OptimisticTaskAction>(
    initialTasks,
    applyAction,
  );

  const inProgress = tasks.filter(
    (t) => t.status === "in_progress" || t.status === "in_review",
  ).length;
  const completedCount = tasks.filter((t) => t.status === "done").length;
  const pct =
    tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  function toggleView(v: "kanban" | "list") {
    router.push(`/projects/${project.id}?view=${v}`);
  }

  function toggleStatus(task: Task) {
    const next: TaskStatus = task.status === "done" ? "todo" : "done";
    // Optimistic update happens synchronously first
    dispatch({ type: "toggle", id: task.id, status: next });
    startTransition(async () => {
      await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
    });
  }

  function moveTask(taskId: string, newStatus: TaskStatus) {
    // Optimistic update happens synchronously first
    dispatch({ type: "toggle", id: taskId, status: newStatus });
    startTransition(async () => {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    });
  }

  function deleteTask(id: string) {
    startTransition(async () => {
      dispatch({ type: "delete", id });
      await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      router.refresh();
    });
  }

  function handleAddTask(task: {
    id: string;
    title: string;
    status: string;
    priority: string;
    project_id: string | null;
    project_name: string | null;
    description: string | null;
    notes: string | null;
    assignee_id: string | null;
    due_date: string | null;
    created_at: string;
  }) {
    startTransition(async () => {
      dispatch({
        type: "add",
        task: {
          ...task,
          user_id: "",
          status: task.status as TaskStatus,
          priority: task.priority as TaskPriority,
        } as unknown as Task,
      });
      router.refresh();
    });
  }

  return (
    <div className='flex h-full flex-col gap-4'>
      {/* Top bar */}
      <div className='flex flex-wrap items-center justify-between gap-3'>
        {/* Breadcrumb */}
        <nav className='flex items-center gap-1 text-sm text-muted-foreground'>
          <Link
            href='/projects'
            className='hover:text-foreground transition-colors'
          >
            Projects
          </Link>
          <ChevronRight className='h-3.5 w-3.5' />
          <span className='flex items-center gap-1.5 font-medium text-foreground'>
            <span
              className='h-2.5 w-2.5 rounded-full'
              style={{ backgroundColor: project.color }}
            />
            {project.name}
          </span>
        </nav>

        {/* Actions */}
        <div className='flex items-center gap-2'>
          {/* View toggle */}
          <div className='flex rounded-md border border-border'>
            <button
              onClick={() => toggleView("kanban")}
              className={cn(
                "flex items-center gap-1.5 rounded-l-md px-3 py-1.5 text-xs font-medium transition-colors",
                view === "kanban"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              <LayoutGrid className='h-3.5 w-3.5' /> Kanban
            </button>
            <button
              onClick={() => toggleView("list")}
              className={cn(
                "flex items-center gap-1.5 rounded-r-md border-l border-border px-3 py-1.5 text-xs font-medium transition-colors",
                view === "list"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              <List className='h-3.5 w-3.5' /> List
            </button>
          </div>
        </div>
      </div>

      {/* Summary bar */}
      <div className='rounded-xl border border-border bg-card p-4'>
        <div className='mb-3 flex flex-wrap items-center gap-4 text-sm'>
          <span className='text-muted-foreground'>
            <span className='font-semibold text-foreground'>
              {tasks.length}
            </span>{" "}
            tasks total
          </span>
          <span className='text-muted-foreground'>
            <span className='font-semibold text-foreground'>{inProgress}</span>{" "}
            in progress
          </span>
          <span className='text-muted-foreground'>
            <span className='font-semibold text-foreground'>
              {completedCount}
            </span>{" "}
            completed
          </span>
          <span
            className='ml-auto font-semibold'
            style={{ color: project.color }}
          >
            {pct}%
          </span>
        </div>
        <div className='h-2 w-full overflow-hidden rounded-full bg-muted'>
          <div
            className='h-full rounded-full transition-all duration-500'
            style={{ width: `${pct}%`, backgroundColor: project.color }}
          />
        </div>
      </div>

      {/* Board / List */}
      <div className='flex-1 min-h-0'>
        {view === "kanban" ? (
          <KanbanView
            tasks={tasks}
            projectId={project.id}
            onMove={moveTask}
            onDelete={deleteTask}
            onAdd={handleAddTask}
          />
        ) : (
          <ListView
            tasks={tasks}
            projectId={project.id}
            onToggle={toggleStatus}
            onDelete={deleteTask}
            onAdd={handleAddTask}
          />
        )}
      </div>
    </div>
  );
}
