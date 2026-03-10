"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PRIORITY_OPTIONS = [
  { value: "", label: "All priorities" },
  { value: "high",   label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low",    label: "Low" },
];

const SORT_OPTIONS = [
  { value: "created",       label: "Date created" },
  { value: "deadline_asc",  label: "Deadline ↑" },
  { value: "deadline_desc", label: "Deadline ↓" },
  { value: "priority",      label: "Priority" },
];

interface Project { id: string; name: string }

interface TaskFiltersProps {
  projects: Project[];
}

export function TaskFilters({ projects }: TaskFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const priority = searchParams.get("priority") ?? "";
  const project  = searchParams.get("project")  ?? "";
  const sort     = searchParams.get("sort")      ?? "created";

  const hasActiveFilters = priority || project;

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      router.push(`/tasks?${params.toString()}`);
    },
    [router, searchParams]
  );

  function clearFilters() {
    router.push("/tasks");
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Priority filter */}
      <select
        value={priority}
        onChange={(e) => update("priority", e.target.value)}
        className={cn(
          "rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring",
          priority && "border-primary ring-1 ring-primary"
        )}
      >
        {PRIORITY_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {/* Project filter */}
      {projects.length > 0 && (
        <select
          value={project}
          onChange={(e) => update("project", e.target.value)}
          className={cn(
            "rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring",
            project && "border-primary ring-1 ring-primary"
          )}
        >
          <option value="">All projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      )}

      {/* Sort */}
      <select
        value={sort}
        onChange={(e) => update("sort", e.target.value)}
        className="rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {/* Clear filters */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground">
          <X className="h-3.5 w-3.5" /> Clear filters
        </Button>
      )}
    </div>
  );
}
