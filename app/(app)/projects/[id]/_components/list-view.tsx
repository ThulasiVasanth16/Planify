"use client";

import Link from "next/link";
import { CheckCircle2, Circle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Task, TaskStatus } from "@/lib/tasks";

const PRIORITY_COLOR: Record<string, string> = {
  high:   "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  low:    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

const STATUS_LABEL: Record<TaskStatus, string> = {
  todo:        "To Do",
  in_progress: "In Progress",
  in_review:   "In Review",
  done:        "Done",
};

interface ListViewProps {
  tasks: Task[];
  onToggle: (task: Task) => void;
  onDelete: (id: string) => void;
}

const GROUP_ORDER: TaskStatus[] = ["in_progress", "in_review", "todo", "done"];

export function ListView({ tasks, onToggle, onDelete }: ListViewProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        No tasks in this project yet.
      </div>
    );
  }

  const grouped = GROUP_ORDER.map((status) => ({
    status,
    tasks: tasks.filter((t) => t.status === status),
  })).filter((g) => g.tasks.length > 0);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col gap-6 overflow-y-auto">
      {grouped.map(({ status, tasks: groupTasks }) => (
        <div key={status}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {STATUS_LABEL[status]} · {groupTasks.length}
          </h3>

          <div className="flex flex-col divide-y divide-border rounded-xl border border-border bg-card overflow-hidden">
            {groupTasks.map((task) => {
              const done = task.status === "done";
              const overdue = !done && task.due_date && task.due_date < today;

              return (
                <div
                  key={task.id}
                  className="group flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
                >
                  {/* Toggle */}
                  <button
                    onClick={() => onToggle(task)}
                    className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
                  >
                    {done
                      ? <CheckCircle2 className="h-4 w-4 text-primary" />
                      : <Circle className="h-4 w-4" />}
                  </button>

                  {/* Title */}
                  <Link
                    href={`/tasks/${task.id}`}
                    className={cn(
                      "flex-1 truncate text-sm font-medium hover:underline underline-offset-2",
                      done && "line-through text-muted-foreground"
                    )}
                  >
                    {task.title}
                  </Link>

                  {/* Meta */}
                  <div className="ml-auto flex shrink-0 items-center gap-2">
                    <span className={cn("rounded px-1.5 py-0.5 text-xs font-medium capitalize", PRIORITY_COLOR[task.priority])}>
                      {task.priority}
                    </span>
                    {task.due_date && (
                      <span className={cn("text-xs text-muted-foreground", overdue && "text-destructive font-medium")}>
                        {new Date(task.due_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    )}
                    <button
                      onClick={() => onDelete(task.id)}
                      className="text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
