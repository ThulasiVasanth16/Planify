"use client";

import { useOptimistic, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Task } from "@/lib/tasks";

const PRIORITY_COLOR: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  high: "destructive",
  medium: "secondary",
  low: "outline",
};

export function PriorityQueue({ initialTasks }: { initialTasks: Task[] }) {
  const [, startTransition] = useTransition();
  const [tasks, updateOptimistic] = useOptimistic(
    initialTasks,
    (state: Task[], { id, status }: { id: string; status: Task["status"] }) =>
      state.map((t) => (t.id === id ? { ...t, status } : t))
  );

  function toggleDone(task: Task) {
    const newStatus: Task["status"] = task.status === "done" ? "in_progress" : "done";

    startTransition(async () => {
      updateOptimistic({ id: task.id, status: newStatus });
      await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    });
  }

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-destructive" />
          <CardTitle>Priority Queue</CardTitle>
        </div>
        <CardDescription>Top 5 high-priority tasks that need attention.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        {tasks.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center gap-1 text-center">
            <CheckCircle2 className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm font-medium">All clear!</p>
            <p className="text-xs text-muted-foreground">No high-priority tasks pending.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {tasks.map((task) => {
              const isDone = task.status === "done";
              return (
                <li
                  key={task.id}
                  className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
                >
                  {/* Status toggle */}
                  <button
                    onClick={() => toggleDone(task)}
                    aria-label={isDone ? "Mark as in progress" : "Mark as done"}
                    className="mt-0.5 shrink-0 text-muted-foreground transition-colors hover:text-primary"
                  >
                    {isDone ? (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </button>

                  {/* Task info */}
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "truncate text-sm font-medium leading-snug transition-colors",
                        isDone && "text-muted-foreground line-through"
                      )}
                    >
                      {task.title}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      {task.project_name && (
                        <span className="truncate text-xs text-muted-foreground">
                          {task.project_name}
                        </span>
                      )}
                      {task.due_date && (
                        <span className="text-xs text-muted-foreground">
                          · Due {new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      )}
                    </div>
                  </div>

                  <Badge variant={PRIORITY_COLOR[task.priority]} className="shrink-0 text-xs">
                    {task.priority}
                  </Badge>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
