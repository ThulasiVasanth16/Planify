"use client";

import { useOptimistic, useTransition, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Circle, Trash2 } from "lucide-react";
import { TaskFilters } from "./task-filters";
import { QuickAdd } from "./quick-add";
import type { Task, TaskStatus } from "@/lib/tasks";
import { cn } from "@/lib/utils";
import { useCreateTask } from "@/components/providers/create-task-provider";

interface Column {
  id: TaskStatus | "in_review";
  label: string;
  statuses: TaskStatus[];
}

const COLUMNS: Column[] = [
  { id: "todo", label: "To Do", statuses: ["todo"] },
  {
    id: "in_progress",
    label: "In Progress",
    statuses: ["in_progress", "in_review"],
  },
  { id: "done", label: "Done", statuses: ["done"] },
];

const PRIORITY_COLOR: Record<string, string> = {
  high: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  medium:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  low: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

interface TaskBoardProps {
  initialTasks: Task[];
  projects: { id: string; name: string }[];
  activeFilters: { priority?: string; project?: string; sort?: string };
}

type OptimisticAction =
  | { type: "toggle"; id: string; status: TaskStatus }
  | { type: "delete"; id: string }
  | { type: "add"; task: Task };

function applyAction(tasks: Task[], action: OptimisticAction): Task[] {
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

export function TaskBoard({
  initialTasks,
  projects,
  activeFilters,
}: TaskBoardProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const { registerOnSuccess } = useCreateTask();
  const [tasks, dispatch] = useOptimistic<Task[], OptimisticAction>(
    initialTasks,
    applyAction,
  );

  // Register the addTask callback with the global provider
  useEffect(() => {
    const unsubscribe = registerOnSuccess((task) => {
      // Update optimistic state immediately
      dispatch({ type: "add", task: task as unknown as Task });
      // Delay refresh to let optimistic update show first
      setTimeout(() => router.refresh(), 100);
    });
    return unsubscribe;
  }, [registerOnSuccess, dispatch, router]);

  function toggleStatus(task: Task) {
    const next: TaskStatus = task.status === "done" ? "todo" : "done";
    startTransition(async () => {
      dispatch({ type: "toggle", id: task.id, status: next });
      await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      // Refresh to sync server data
      router.refresh();
    });
  }

  function deleteTask(id: string) {
    startTransition(async () => {
      dispatch({ type: "delete", id });
      await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      router.refresh();
    });
  }

  function addTask(task: Task) {
    startTransition(async () => {
      dispatch({ type: "add", task });
      // Delay refresh to let optimistic update show first
      setTimeout(() => router.refresh(), 100);
    });
  }

  return (
    <div className='flex flex-col gap-4 flex-1 min-h-0'>
      <TaskFilters projects={projects} />

      <div className='grid flex-1 grid-cols-1 gap-4 md:grid-cols-3 min-h-0'>
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => col.statuses.includes(t.status));
          const targetStatus = col.statuses[0] as TaskStatus;

          return (
            <div
              key={col.id}
              className='flex flex-col rounded-xl border border-border bg-muted/30 overflow-hidden'
            >
              {/* Column header */}
              <div className='flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50'>
                <span className='text-sm font-semibold'>{col.label}</span>
                <span className='rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground font-medium'>
                  {colTasks.length}
                </span>
              </div>

              {/* Task list */}
              <div className='flex flex-col gap-2 p-3 flex-1 overflow-y-auto'>
                {colTasks.length === 0 && (
                  <p className='py-8 text-center text-xs text-muted-foreground'>
                    No tasks
                  </p>
                )}
                {colTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggle={() => toggleStatus(task)}
                    onDelete={() => deleteTask(task.id)}
                  />
                ))}

                {/* Quick add */}
                <QuickAdd
                  status={targetStatus}
                  projectId={activeFilters.project ?? null}
                  onAdd={addTask}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TaskCard({
  task,
  onToggle,
  onDelete,
}: {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const done = task.status === "done";

  return (
    <div className='group flex items-start gap-2 rounded-lg border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md'>
      {/* Toggle button */}
      <button
        onClick={onToggle}
        className='mt-0.5 shrink-0 text-muted-foreground hover:text-primary transition-colors'
        aria-label={done ? "Mark incomplete" : "Mark complete"}
      >
        {done ? (
          <CheckCircle2 className='h-4 w-4 text-primary' />
        ) : (
          <Circle className='h-4 w-4' />
        )}
      </button>

      {/* Content */}
      <div className='min-w-0 flex-1'>
        <Link
          href={`/tasks/${task.id}`}
          className={cn(
            "text-sm font-medium leading-snug hover:underline underline-offset-2",
            done && "line-through text-muted-foreground",
          )}
        >
          {task.title}
        </Link>

        <div className='mt-1.5 flex flex-wrap items-center gap-1.5'>
          <span
            className={cn(
              "rounded px-1.5 py-0.5 text-xs font-medium capitalize",
              PRIORITY_COLOR[task.priority],
            )}
          >
            {task.priority}
          </span>
          {task.project_name && (
            <span className='rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground truncate max-w-30'>
              {task.project_name}
            </span>
          )}
          {task.due_date && (
            <span
              className={cn(
                "text-xs text-muted-foreground",
                !done &&
                  task.due_date < new Date().toISOString().slice(0, 10) &&
                  "text-destructive font-medium",
              )}
            >
              {formatDate(task.due_date)}
            </span>
          )}
        </div>
      </div>

      {/* Delete */}
      <button
        onClick={onDelete}
        className='shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-all'
        aria-label='Delete task'
      >
        <Trash2 className='h-3.5 w-3.5' />
      </button>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
