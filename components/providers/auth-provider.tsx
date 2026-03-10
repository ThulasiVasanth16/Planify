"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, Suspense } from "react";

interface AuthWrapperProps {
  children: React.ReactNode;
}

function AuthController({ children }: AuthWrapperProps) {
  const { userId, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !userId) {
      router.push("/sign-in");
    }
  }, [userId, isLoaded, router]);

  // Show loading while auth is initializing
  if (!isLoaded) {
    return (
      <div className='flex h-full items-center justify-center'>
        <div className='flex flex-col items-center gap-3'>
          <div className='h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent' />
          <p className='text-sm text-muted-foreground'>Authenticating...</p>
        </div>
      </div>
    );
  }

  // Don't render children if not authenticated
  if (!userId) {
    return null;
  }

  return <>{children}</>;
}

export function AuthProvider({ children }: AuthWrapperProps) {
  return (
    <Suspense
      fallback={
        <div className='flex h-full items-center justify-center'>
          <div className='flex flex-col items-center gap-3'>
            <div className='h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent' />
            <p className='text-sm text-muted-foreground'>Loading...</p>
          </div>
        </div>
      }
    >
      <AuthController>{children}</AuthController>
    </Suspense>
  );
}
