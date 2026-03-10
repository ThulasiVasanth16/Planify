import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Zap,
  ArrowRight,
  Play,
  CheckCircle2,
  BarChart2,
  Users,
} from "lucide-react";

export default async function LandingPage() {
  // Redirect to dashboard if already logged in
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <div className='min-h-screen bg-background text-foreground'>
      {/* ── Top Navigation ── */}
      <header className='sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur'>
        <div className='mx-auto flex h-14 max-w-7xl items-center justify-between px-6'>
          {/* Logo */}
          <div className='flex items-center gap-2'>
            <Zap className='h-5 w-5 text-primary' />
            <span className='font-semibold'>Planify</span>
          </div>

          {/* Nav links */}
          <nav className='hidden items-center gap-6 text-sm text-muted-foreground md:flex'>
            <Link
              href='/features'
              className='hover:text-foreground transition-colors'
            >
              Features
            </Link>
            <Link
              href='/pricing'
              className='hover:text-foreground transition-colors'
            >
              Pricing
            </Link>
            <Link
              href='/about'
              className='hover:text-foreground transition-colors'
            >
              About
            </Link>
          </nav>

          {/* Auth CTAs */}
          <div className='flex items-center gap-3'>
            <Button variant='ghost' size='sm' asChild>
              <Link href='/sign-in'>Sign In</Link>
            </Button>
            <Button size='sm' asChild>
              <Link href='/sign-up'>Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className='mx-auto max-w-7xl px-6 py-24 text-center'>
        <h1 className='text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl'>
          Plan smarter, <span className='text-primary'>deliver faster</span>
        </h1>
        <p className='mx-auto mt-6 max-w-2xl text-lg text-muted-foreground'>
          Planify brings your team&apos;s projects, tasks, and goals into one
          place — so you can focus on building great things instead of managing
          chaos.
        </p>

        {/* Primary CTA buttons */}
        <div className='mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row'>
          <Button size='lg' asChild>
            <Link href='/sign-up'>
              Get Started <ArrowRight className='ml-1 h-4 w-4' />
            </Link>
          </Button>
          <Button size='lg' variant='outline' asChild>
            <Link href='/demo'>
              <Play className='mr-1 h-4 w-4' /> See demo
            </Link>
          </Button>
        </div>

        {/* Dashboard preview placeholder */}
        <div className='mx-auto mt-16 max-w-5xl overflow-hidden rounded-xl border border-border bg-muted shadow-2xl'>
          <div className='flex h-8 items-center gap-1.5 border-b border-border bg-card px-4'>
            <span className='h-2.5 w-2.5 rounded-full bg-red-400' />
            <span className='h-2.5 w-2.5 rounded-full bg-yellow-400' />
            <span className='h-2.5 w-2.5 rounded-full bg-green-400' />
            <span className='ml-3 text-xs text-muted-foreground'>
              app.planify.io/dashboard
            </span>
          </div>
          <div className='flex h-72 items-center justify-center bg-muted'>
            <p className='text-sm text-muted-foreground'>
              [ App dashboard preview ]
            </p>
          </div>
        </div>
      </section>

      {/* ── Why Planify ── */}
      <section className='mx-auto max-w-7xl px-6 pb-24'>
        <h2 className='mb-10 text-center text-2xl font-bold tracking-tight sm:text-3xl'>
          Why Planify?
        </h2>
        <div className='grid gap-6 sm:grid-cols-3'>
          <Card>
            <CardHeader>
              <CheckCircle2 className='mb-2 h-8 w-8 text-primary' />
              <CardTitle>Task Management</CardTitle>
              <CardDescription>
                Create, assign, and track tasks across projects with real-time
                progress updates and priority controls.
              </CardDescription>
            </CardHeader>
            <CardContent />
          </Card>

          <Card>
            <CardHeader>
              <Users className='mb-2 h-8 w-8 text-primary' />
              <CardTitle>Team Collaboration</CardTitle>
              <CardDescription>
                Invite teammates, assign roles, and collaborate seamlessly
                across departments — all in one workspace.
              </CardDescription>
            </CardHeader>
            <CardContent />
          </Card>

          <Card>
            <CardHeader>
              <BarChart2 className='mb-2 h-8 w-8 text-primary' />
              <CardTitle>Insights & Reports</CardTitle>
              <CardDescription>
                Get actionable analytics on team velocity, project health, and
                delivery timelines to make smarter decisions.
              </CardDescription>
            </CardHeader>
            <CardContent />
          </Card>
        </div>
      </section>
    </div>
  );
}
