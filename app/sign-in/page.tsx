import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { Zap } from "lucide-react";

export default function SignInPage() {
  return (
    <div className='flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12'>
      {/* Logo + heading */}
      <div className='mb-6 flex flex-col items-center gap-3 text-center'>
        <Link href='/' className='flex items-center gap-2'>
          <Zap className='h-6 w-6 text-primary' />
          <span className='text-xl font-bold'>Planify</span>
        </Link>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Welcome back</h1>
          <p className='mt-1 text-sm text-muted-foreground'>
            Sign in to continue to your workspace.
          </p>
        </div>
      </div>

      {/*
        Clerk <SignIn /> renders the full authentication flow:
        - Google and GitHub social sign-in buttons
        - Email and password fields
        - "Forgot password?" link for password reset
        - Clerk attribution footer
        routing="hash" keeps multi-step flows (e.g. MFA) on /sign-in
        without requiring a catch-all [[...rest]] directory.
        Redirect logic:
        - New users without a workspace → /onboarding
        - Returning users with an existing workspace → /dashboard
        Both handled via NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL or post-sign-in redirect logic.
      */}
      <SignIn
        routing='hash'
        forceRedirectUrl='/dashboard'
        appearance={{
          elements: {
            rootBox: "w-full max-w-md",
            card: "rounded-xl border border-border bg-card shadow-sm",
            headerTitle: "hidden",
            headerSubtitle: "hidden",
          },
        }}
      />

      {/* Sign up link */}
      <p className='mt-5 text-sm text-muted-foreground'>
        Don&apos;t have an account?{" "}
        <Link
          href='/sign-up'
          className='font-medium text-foreground underline-offset-4 hover:underline'
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
