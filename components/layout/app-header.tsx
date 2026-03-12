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
    <header className='flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4 lg:px-6'>
      {/* Spacer for mobile menu button */}
      <div className='w-8 lg:w-0' />

      <div className='flex items-center gap-2 lg:gap-3'>
        <Button size='sm' onClick={() => open()} className='gap-1.5'>
          <Plus className='h-4 w-4' />
          <span className='hidden sm:inline'>New Task</span>
        </Button>
        <UserButton />
      </div>
    </header>
  );
}
