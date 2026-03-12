"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreateTask } from "@/components/providers/create-task-provider";
import { Loader2 } from "lucide-react";
import { usePathname } from "next/navigation";

interface AppHeaderProps {
  title: string;
}

export function AppHeader({ title }: AppHeaderProps) {
  const { open } = useCreateTask();
  const { isLoaded } = useUser();
  const pathname = usePathname();

  // Check if we're on a project page and extract the project ID
  function getProjectIdFromPath(): string {
    const match = pathname.match(/^\/projects\/([^/]+)$/);
    return match ? match[1] : "";
  }

  function handleNewTask() {
    const projectId = getProjectIdFromPath();
    open({ projectId });
  }

  return (
    <header className='flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4 lg:px-6'>
      {/* Spacer for mobile menu button */}
      <div className='w-8 lg:w-0' />

      <div className='flex items-center gap-2 lg:gap-3'>
        <Button size='sm' onClick={handleNewTask} className='gap-1.5 shrink-0'>
          <Plus className='h-4 w-4' />
          <span className='hidden sm:inline'>New Task</span>
        </Button>
        <div className='shrink-0 w-8.5 h-8.5 flex items-center justify-center'>
          {isLoaded ? (
            <UserButton />
          ) : (
            <div className='h-8 w-8 rounded-full bg-muted animate-pulse' />
          )}
        </div>
      </div>
    </header>
  );
}
