"use client";

import { useState, useRef, useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Task, TaskStatus } from "@/lib/tasks";
import { createTaskAction } from "../actions";

interface QuickAddProps {
  status: TaskStatus;
  projectId?: string | null;
  onAdd: (task: Task) => void;
}

export function QuickAdd({ status, projectId, onAdd }: QuickAddProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function openInput() {
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function reset() {
    setOpen(false);
    setValue("");
  }

  async function submit() {
    const title = value.trim();
    if (!title) {
      reset();
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("status", status);
      if (projectId) {
        formData.append("projectId", projectId);
      }

      try {
        const task = await createTaskAction(formData);
        onAdd(task);
      } catch (error) {
        console.error("Failed to create task:", error);
      }
      reset();
    });
  }

  if (!open) {
    return (
      <button
        onClick={openInput}
        className='flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors'
      >
        <Plus className='h-3.5 w-3.5' /> Add task
      </button>
    );
  }

  return (
    <div className='rounded-md border border-input bg-background p-2 shadow-sm'>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") reset();
        }}
        placeholder='Task title…'
        className='w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground'
        disabled={isPending}
      />
      <div className='mt-2 flex gap-1.5'>
        <Button
          size='sm'
          className='h-6 px-2 text-xs'
          onClick={submit}
          disabled={isPending}
        >
          {isPending ? "Adding…" : "Add"}
        </Button>
        <Button
          size='sm'
          variant='ghost'
          className='h-6 px-2 text-xs'
          onClick={reset}
          disabled={isPending}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
