"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Trash2, Save, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Task, TaskStatus, TaskPriority } from "@/lib/tasks";

// Date validation helper
function isValidDate(dateStr: string): { valid: boolean; error?: string } {
  if (!dateStr) return { valid: true }; // Empty is OK (optional field)

  // Check year is 4 digits
  const year = parseInt(dateStr.split("-")[0], 10);
  if (year < 1000 || year > 9999) {
    return { valid: false, error: "Year must be 4 digits" };
  }

  const date = new Date(dateStr + "T00:00:00");
  if (isNaN(date.getTime())) {
    return { valid: false, error: "Invalid date format" };
  }

  // Check date is not in the past (before today)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date < today) {
    return { valid: false, error: "Date cannot be in the past" };
  }

  return { valid: true };
}

interface TaskDetailProps {
  task: Task;
  projects: { id: string; name: string }[];
}

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "in_review", label: "In Review" },
  { value: "done", label: "Done" },
];

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const STATUS_COLOR: Record<TaskStatus, string> = {
  todo: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  in_progress:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  in_review:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  done: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

const PRIORITY_COLOR: Record<TaskPriority, string> = {
  high: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  medium:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  low: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

export function TaskDetail({ task, projects }: TaskDetailProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Editable field state
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [notes, setNotes] = useState(task.notes ?? "");
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [projectId, setProjectId] = useState(task.project_id ?? "");
  const [dueDate, setDueDate] = useState(task.due_date ?? "");
  const [dueDateError, setDueDateError] = useState<string | null>(null);

  function handleSave() {
    if (!title.trim()) {
      setSaveError("Title is required.");
      return;
    }
    // Validate date
    if (dueDate) {
      const validation = isValidDate(dueDate);
      if (!validation.valid) {
        setDueDateError(validation.error!);
        return;
      }
    }
    setSaveError(null);

    startTransition(async () => {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description || null,
          notes: notes || null,
          status,
          priority,
          projectId: projectId || null,
          dueDate: dueDate || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSaveError((data as { error?: string }).error ?? "Failed to save.");
        return;
      }

      router.refresh();
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
      router.push("/tasks");
    });
  }

  const createdAt = new Date(task.created_at);
  const formattedCreated = createdAt.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className='flex h-full flex-col gap-4'>
      {/* Top bar */}
      <div className='flex flex-wrap items-center justify-between gap-3'>
        {/* Breadcrumb */}
        <nav className='flex items-center gap-1 text-sm text-muted-foreground'>
          <Link
            href='/tasks'
            className='hover:text-foreground transition-colors'
          >
            My Tasks
          </Link>
          <ChevronRight className='h-3.5 w-3.5' />
          <span className='max-w-[200px] truncate text-foreground font-medium'>
            {task.title}
          </span>
        </nav>

        {/* Actions */}
        <div className='flex items-center gap-2'>
          {saveError && (
            <span className='flex items-center gap-1 text-sm text-destructive'>
              <AlertCircle className='h-3.5 w-3.5' /> {saveError}
            </span>
          )}
          <Button onClick={handleSave} disabled={isPending} size='sm'>
            <Save className='mr-1.5 h-3.5 w-3.5' />
            {isPending ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Main layout: left + right panels */}
      <div className='flex flex-1 gap-6 overflow-hidden'>
        {/* ── Left panel ── */}
        <div className='flex flex-1 flex-col gap-5 overflow-y-auto min-w-0'>
          {/* Title */}
          <div>
            <label className='mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wider'>
              Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className='w-full rounded-md border border-input bg-background px-3 py-2 text-lg font-semibold focus:outline-none focus:ring-1 focus:ring-ring'
              placeholder='Task title'
            />
          </div>

          {/* Description */}
          <div>
            <label className='mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wider'>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className='w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring'
              placeholder='Add a detailed description…'
            />
          </div>

          {/* Notes */}
          <div>
            <label className='mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wider'>
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className='w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring'
              placeholder='Internal notes, links, reminders…'
            />
          </div>

          {/* Activity log */}
          <div>
            <label className='mb-2 block text-xs font-medium text-muted-foreground uppercase tracking-wider'>
              Activity
            </label>
            <ol className='space-y-3 border-l-2 border-border pl-4'>
              <li className='relative'>
                <span className='absolute -left-[1.1rem] top-1 h-2 w-2 rounded-full border-2 border-border bg-background' />
                <p className='text-sm text-muted-foreground'>
                  <span className='font-medium text-foreground'>
                    Task created
                  </span>
                  {" · "}
                  <span className='inline-flex items-center gap-1'>
                    <Clock className='h-3 w-3' /> {formattedCreated}
                  </span>
                </p>
              </li>
              <li className='relative'>
                <span className='absolute -left-[1.1rem] top-1 h-2 w-2 rounded-full border-2 border-border bg-background' />
                <p className='text-sm text-muted-foreground'>
                  <span className='font-medium text-foreground'>
                    Current status
                  </span>
                  {" — "}
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-xs font-medium",
                      STATUS_COLOR[task.status],
                    )}
                  >
                    {STATUS_OPTIONS.find((s) => s.value === task.status)?.label}
                  </span>
                </p>
              </li>
              <li className='relative'>
                <span className='absolute -left-[1.1rem] top-1 h-2 w-2 rounded-full border-2 border-border bg-background' />
                <p className='text-sm text-muted-foreground'>
                  <span className='font-medium text-foreground'>Priority</span>
                  {" — "}
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-xs font-medium capitalize",
                      PRIORITY_COLOR[task.priority],
                    )}
                  >
                    {task.priority}
                  </span>
                </p>
              </li>
            </ol>
          </div>
        </div>

        {/* ── Right panel ── */}
        <aside className='flex w-64 shrink-0 flex-col gap-5 overflow-y-auto'>
          <div className='rounded-xl border border-border bg-card p-4 space-y-4'>
            {/* Status */}
            <Field label='Status'>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className='w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring'
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>

            {/* Priority */}
            <Field label='Priority'>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className='w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring'
              >
                {PRIORITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>

            {/* Deadline */}
            <Field label='Deadline'>
              <input
                type='date'
                value={dueDate}
                onChange={(e) => {
                  const val = e.target.value;
                  setDueDate(val);
                  if (val) {
                    const validation = isValidDate(val);
                    setDueDateError(
                      validation.valid ? null : validation.error!,
                    );
                  } else {
                    setDueDateError(null);
                  }
                }}
                className={cn(
                  "w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring",
                  dueDateError && "border-destructive focus:ring-destructive",
                )}
              />
              {dueDateError && (
                <p className='mt-1 text-xs text-destructive'>{dueDateError}</p>
              )}
            </Field>

            {/* Project */}
            <Field label='Project'>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className='w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring'
              >
                <option value=''>No project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {/* Delete */}
          <div className='rounded-xl border border-destructive/30 bg-destructive/5 p-4'>
            <p className='mb-2 text-sm font-medium text-destructive'>
              Danger Zone
            </p>
            <p className='mb-3 text-xs text-muted-foreground'>
              Deleting a task is permanent and cannot be undone.
            </p>
            {showDeleteConfirm ? (
              <div className='space-y-2'>
                <p className='text-xs font-medium text-destructive'>
                  Are you sure?
                </p>
                <div className='flex gap-2'>
                  <Button
                    variant='destructive'
                    size='sm'
                    className='flex-1'
                    onClick={handleDelete}
                    disabled={isPending}
                  >
                    {isPending ? "Deleting…" : "Yes, delete"}
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    className='flex-1'
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isPending}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant='destructive'
                size='sm'
                className='w-full'
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className='mr-1.5 h-3.5 w-3.5' /> Delete Task
              </Button>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className='mb-1 block text-xs font-medium text-muted-foreground'>
        {label}
      </label>
      {children}
    </div>
  );
}
