import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";
import { Zap, ArrowRight } from "lucide-react";
import { getWorkspaceByUserId } from "@/lib/workspace";

export default async function OnboardingWelcomePage() {
  const { userId } = await auth();

  // If user is already logged in and has a workspace, redirect to dashboard
  if (userId) {
    const workspace = await getWorkspaceByUserId(userId);
    if (workspace) {
      redirect("/dashboard");
    }
    // If no workspace, continue to show onboarding page
  }

  return (
    <div className='flex min-h-screen flex-col items-center justify-center bg-background px-6'>
      {/* Logo */}
      <div className='mb-8 flex items-center gap-2'>
        <Zap className='h-7 w-7 text-primary' />
        <span className='text-xl font-bold'>Planify</span>
      </div>

      {/* Step indicator */}
      <div className='mb-6 flex items-center gap-2 text-sm text-muted-foreground'>
        <span className='flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground'>
          1
        </span>
        <span className='h-px w-8 bg-border' />
        <span className='flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground'>
          2
        </span>
      </div>

      {/* Content */}
      <div className='w-full max-w-md text-center'>
        <h1 className='text-3xl font-bold tracking-tight'>
          Welcome to Planify
        </h1>
        <p className='mt-3 text-muted-foreground'>
          Let&apos;s get your workspace set up in just a couple of steps. This
          only takes 2 minutes.
        </p>

        <div className='mt-8 flex flex-col gap-3 rounded-xl border border-border bg-card p-6 text-left'>
          <div className='flex items-start gap-3'>
            <span className='mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground'>
              1
            </span>
            <div>
              <p className='font-medium'>Create your workspace</p>
              <p className='text-sm text-muted-foreground'>
                Name your team and choose a workspace URL.
              </p>
            </div>
          </div>
          <div className='flex items-start gap-3'>
            <span className='mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground'>
              2
            </span>
            <div>
              <p className='font-medium text-muted-foreground'>
                Invite your team
              </p>
              <p className='text-sm text-muted-foreground'>
                Add teammates so you can collaborate right away.
              </p>
            </div>
          </div>
        </div>

        <Button className='mt-6 w-full' size='lg' asChild>
          <Link href='/onboarding/workspace'>
            Let&apos;s get started <ArrowRight className='ml-1 h-4 w-4' />
          </Link>
        </Button>
      </div>
    </div>
  );
}
