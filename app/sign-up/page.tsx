import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { Zap } from "lucide-react";

export default function SignUpPage() {
  return (
    <div className='flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12'>
      {/* Logo + heading */}
      <div className='mb-6 flex flex-col items-center gap-3 text-center'>
        <Link href='/' className='flex items-center gap-2'>
          <Zap className='h-6 w-6 text-primary' />
          <span className='text-xl font-bold'>Planify</span>
        </Link>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>
            Create your account
          </h1>
          <p className='mt-1 text-sm text-muted-foreground'>
            Start planning smarter with your team today.
          </p>
        </div>
      </div>

      {/*
        Clerk <SignUp /> renders the full registration flow:
        - Google and GitHub social sign-up buttons
        - Full name, email, and password fields
        - Email verification step
        - Clerk attribution footer
        routing="hash" keeps multi-step flows on the same /sign-up route
        without requiring a catch-all [[...rest]] directory.
        On success, Clerk redirects to /onboarding (set via NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL).
      */}
      <SignUp
        routing='hash'
        forceRedirectUrl='/onboarding'
        appearance={{
          elements: {
            rootBox: "w-full max-w-md",
            card: "rounded-xl border border-border bg-card shadow-sm",
            headerTitle: "hidden",
            headerSubtitle: "hidden",
          },
        }}
      />

      {/* Sign in link */}
      <p className='mt-5 text-sm text-muted-foreground'>
        Already have an account?{" "}
        <Link
          href='/sign-in'
          className='font-medium text-foreground underline-offset-4 hover:underline'
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
