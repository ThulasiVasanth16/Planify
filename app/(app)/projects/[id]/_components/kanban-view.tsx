"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, Trash2 } from "lucide-react";
import { QuickAdd } from "@/app/(app)/tasks/_components/quick-add";
import { cn } from "@/lib/utils";
import type { Task, TaskStatus } from "@/lib/tasks";

const COLUMNS: { id: TaskStatus; label: string; statuses: TaskStatus[] }[] = [
  { id: "todo",        label: "To Do",       statuses: ["todo"] },
  { id: "in_progress", label: "In Progress", statuses: ["in_progress", "in_review"] },
  { id: "done",        label: "Done",        statuses: ["done"] },
];

const PRIORITY_COLOR: Record<string, string> = {
  high:   "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  low:    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

interface KanbanViewProps {
  tasks: Task[];
  projectId: string;
  onMove: (taskId: string, status: TaskStatus) => void;
  onDelete: (id: string) => void;
  onAdd: (task: Task) => void;
}

export function KanbanView({ tasks, projectId, onMove, onDelete, onAdd }: KanbanViewProps) {
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  function handleDragStart(e: React.DragEvent, taskId: string) {
    e.dataTransfer.setData("taskId", taskId);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e: React.DragEvent, colId: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverCol(colId);
  }

  function handleDrop(e: React.DragEvent, status: TaskStatus) {
    e.preventDefault();
    setDragOverCol(null);
    const taskId = e.dataTransfer.getData("taskId");
    if (taskId) onMove(taskId, status);
  }

  return (
    <div className="grid h-full grid-cols-1 gap-4 md:grid-cols-3">
      {COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => col.statuses.includes(t.status));
        const isDragOver = dragOverCol === col.id;

        return (
          <div
            key={col.id}
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDragLeave={() => setDragOverCol(null)}
            onDrop={(e) => handleDrop(e, col.id as TaskStatus)}
            className={cn(
              "flex flex-col rounded-xl border border-border bg-muted/30 overflow-hidden transition-colors",
              isDragOver && "border-primary bg-primary/5"
            )}
          >
            {/* Column header */}
            <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-3">
              <span className="text-sm font-semibold">{col.label}</span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {colTasks.length}
              </span>
            </div>

            {/* Cards */}
            <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
              {colTasks.length === 0 && !isDragOver && (
                <p className="py-6 text-center text-xs text-muted-foreground">Drop tasks here</p>
              )}

              {colTasks.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  className="group flex cursor-grab items-start gap-2 rounded-lg border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing active:opacity-70"
                >
                  {/* Toggle */}
                  <button
                    onClick={() => onMove(task.id, task.status === "done" ? "todo" : "done")}
                    className="mt-0.5 shrink-0 text-muted-foreground hover:text-primary transition-colors"
                  >
                    {task.status === "done"
                      ? <CheckCircle2 className="h-4 w-4 text-primary" />
                      : <Circle className="h-4 w-4" />}
                  </button>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/tasks/${task.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className={cn(
                        "block text-sm font-medium leading-snug hover:underline underline-offset-2",
                        task.status === "done" && "line-through text-muted-foreground"
                      )}
                    >
                      {task.title}
                    </Link>

                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <span className={cn("rounded px-1.5 py-0.5 text-xs font-medium capitalize", PRIORITY_COLOR[task.priority])}>
                        {task.priority}
                      </span>
                      {task.due_date && (
                        <span className={cn(
                          "text-xs text-muted-foreground",
                          task.status !== "done" && task.due_date < new Date().toISOString().slice(0, 10) && "text-destructive font-medium"
                        )}>
                          {formatDate(task.due_date)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => onDelete(task.id)}
                    className="mt-0.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}

              <QuickAdd status={col.id as TaskStatus} projectId={projectId} onAdd={onAdd} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
