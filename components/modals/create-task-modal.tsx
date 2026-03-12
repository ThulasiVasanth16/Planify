"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { X, Zap, LayoutList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TaskStatus, TaskPriority } from "@/lib/tasks";
import { createTaskAction } from "@/app/(app)/tasks/actions";

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

type Mode = "quick" | "detailed";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: { id: string; name: string }[];
  defaultStatus?: string;
  defaultProjectId?: string;
  onSuccess?: (task: {
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
  }) => void;
  getAllCallbacks?: () => {
    (task: {
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
    }): void;
  }[];
}

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "in_review", label: "In Review" },
  { value: "done", label: "Done" },
];

export function CreateTaskModal({
  isOpen,
  onClose,
  projects,
  defaultStatus = "todo",
  defaultProjectId = "",
  onSuccess,
  getAllCallbacks,
}: CreateTaskModalProps) {
  const router = useRouter();
  const titleRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<Mode>("quick");
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [dueDateError, setDueDateError] = useState<string | null>(null);
  const [status, setStatus] = useState<TaskStatus>(defaultStatus as TaskStatus);
  const [projectId, setProjectId] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setPriority("medium");
      setDueDate("");
      setStatus(defaultStatus as TaskStatus);
      setProjectId(defaultProjectId);
      setDescription("");
      setError(null);
      setMode("quick");
      setTimeout(() => titleRef.current?.focus(), 50);
    }
  }, [isOpen, defaultStatus]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Task title is required.");
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
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("priority", priority);
      formData.append("status", mode === "detailed" ? status : "todo");
      if (mode === "detailed" && projectId) {
        formData.append("projectId", projectId);
      }
      if (dueDate) {
        formData.append("dueDate", dueDate);
      }
      if (mode === "detailed" && description) {
        formData.append("description", description);
      }

      const task = await createTaskAction(formData);

      // Call the onSuccess callback passed via open() options
      if (onSuccess) {
        onSuccess(task);
      }

      // Also call all registered callbacks (for components like TaskBoard)
      if (getAllCallbacks) {
        const callbacks = getAllCallbacks();
        callbacks.forEach((callback) => callback(task));
      }

      onClose();

      // Only refresh if no optimistic callbacks were registered
      if (!onSuccess && !getAllCallbacks) {
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task.");
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    /* Backdrop */
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm'
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Modal panel */}
      <div className='relative w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl'>
        {/* Header */}
        <div className='flex items-center justify-between border-b border-border px-6 py-4'>
          <h2 className='text-base font-semibold'>Create Task</h2>
          <button
            onClick={onClose}
            className='rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors'
            aria-label='Close'
          >
            <X className='h-4 w-4' />
          </button>
        </div>

        {/* Mode toggle */}
        <div className='flex gap-1 border-b border-border px-6 py-3'>
          <ModeButton
            active={mode === "quick"}
            onClick={() => setMode("quick")}
            icon={<Zap className='h-3.5 w-3.5' />}
            label='Quick Add'
          />
          <ModeButton
            active={mode === "detailed"}
            onClick={() => setMode("detailed")}
            icon={<LayoutList className='h-3.5 w-3.5' />}
            label='Detailed'
          />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className='flex flex-col gap-4 px-6 py-5'>
          {/* Hint */}
          <p className='text-xs text-muted-foreground'>
            {mode === "quick"
              ? "Fill in the essentials — you can add more detail later."
              : "Set all fields now for a fully specified task."}
          </p>

          {/* Title */}
          <div>
            <label className='mb-1 block text-xs font-medium text-muted-foreground'>
              Title <span className='text-destructive'>*</span>
            </label>
            <input
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder='What needs to be done?'
              className={cn(
                "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring",
                error && "border-destructive focus:ring-destructive",
              )}
            />
            {error && <p className='mt-1 text-xs text-destructive'>{error}</p>}
          </div>

          {/* Priority + Deadline (always visible) */}
          <div className='grid grid-cols-2 gap-3'>
            <div>
              <label className='mb-1 block text-xs font-medium text-muted-foreground'>
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className='w-full rounded-md border border-input bg-background px-2.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring'
              >
                {PRIORITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className='mb-1 block text-xs font-medium text-muted-foreground'>
                Deadline
              </label>
              <input
                type='date'
                value={dueDate}
                min='1000-01-01'
                max='9999-12-31'
                onChange={(e) => {
                  const val = e.target.value;
                  // Validate that year is exactly 4 digits
                  if (val) {
                    const year = parseInt(val.split("-")[0], 10);
                    if (year < 1000 || year > 9999) {
                      setDueDateError("Year must be 4 digits (1000-9999)");
                      return;
                    }
                  }
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
                  "w-full rounded-md border border-input bg-background px-2.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring",
                  dueDateError && "border-destructive focus:ring-destructive",
                )}
              />
              {dueDateError && (
                <p className='mt-1 text-xs text-destructive'>{dueDateError}</p>
              )}
            </div>
          </div>

          {/* Detailed-only fields */}
          {mode === "detailed" && (
            <>
              {/* Status + Project */}
              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <label className='mb-1 block text-xs font-medium text-muted-foreground'>
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TaskStatus)}
                    className='w-full rounded-md border border-input bg-background px-2.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring'
                  >
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                {projects.length > 0 && (
                  <div>
                    <label className='mb-1 block text-xs font-medium text-muted-foreground'>
                      Project
                    </label>
                    <select
                      value={projectId}
                      onChange={(e) => setProjectId(e.target.value)}
                      className='w-full rounded-md border border-input bg-background px-2.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring'
                    >
                      <option value=''>No project</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className='mb-1 block text-xs font-medium text-muted-foreground'>
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder='Optional details…'
                  className='w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring'
                />
              </div>
            </>
          )}

          {/* Actions */}
          <div className='flex justify-end gap-2 pt-1'>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type='submit' size='sm' disabled={loading}>
              {loading ? "Creating…" : "Create Task"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {icon} {label}
    </button>
  );
}
