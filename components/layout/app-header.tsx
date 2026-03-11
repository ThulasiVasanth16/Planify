"use client";

import { UserButton } from "@clerk/nextjs";

interface AppHeaderProps {
  title: string;
}

export function AppHeader({ title }: AppHeaderProps) {
  return (
    <header className='flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4 lg:px-6'>
      {/* Spacer for mobile menu button */}
      <div className='w-8 lg:w-0' />

      <div className='flex items-center gap-2 lg:gap-3'>
        <UserButton />
      </div>
    </header>
  );
}
