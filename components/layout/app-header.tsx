"use client";

import { UserButton } from "@clerk/nextjs";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreateTask } from "@/components/providers/create-task-provider";

interface AppHeaderProps {
  title: string;
}

export function AppHeader({ title }: AppHeaderProps) {
  const { open } = useCreateTask();

  return (
    <header className='flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-6'>
      <h2 className='text-sm font-semibold text-foreground'>{/* {title} */}</h2>

      <div className='flex items-center gap-3'>
        <Button size='sm' onClick={() => open()}>
          <Plus className='mr-1 h-4 w-4' />
          New Task
        </Button>
        <UserButton />
      </div>
    </header>
  );
}
