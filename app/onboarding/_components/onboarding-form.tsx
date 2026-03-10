"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { completeOnboarding, skipOnboarding } from "../actions";
import {
  GraduationCap,
  Briefcase,
  Laptop,
  Users,
  ArrowRight,
  Loader2,
} from "lucide-react";

const GOALS = [
  {
    id: "student",
    label: "Student / Academic",
    description: "Managing coursework, projects, and study schedules.",
    icon: GraduationCap,
  },
  {
    id: "professional",
    label: "Professional",
    description: "Organising personal work tasks and career goals.",
    icon: Briefcase,
  },
  {
    id: "freelancer",
    label: "Freelancer",
    description: "Tracking client projects, deadlines, and deliverables.",
    icon: Laptop,
  },
  {
    id: "team",
    label: "Small Team",
    description: "Collaborating with a team of up to 20 people.",
    icon: Users,
  },
] as const;

type Goal = (typeof GOALS)[number]["id"];

const STEPS = ["About you", "Your workspace", "Your goal"] as const;

export function OnboardingForm() {
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [goal, setGoal] = useState<Goal>("professional");
  const [isPending, setIsPending] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);

  // Field-level errors
  const [errors, setErrors] = useState<{ displayName?: string; workspaceName?: string }>({});

  function validateStep(s: number) {
    if (s === 1) {
      if (!displayName.trim()) {
        setErrors({ displayName: "Display name is required." });
        return false;
      }
    }
    if (s === 2) {
      if (!workspaceName.trim()) {
        setErrors({ workspaceName: "Workspace name is required." });
        return false;
      }
    }
    setErrors({});
    return true;
  }

  function handleContinue() {
    if (!validateStep(step)) return;
    if (step < 3) {
      setStep(step + 1);
      return;
    }
    // Step 3 — submit
    handleSubmit();
  }

  async function handleSubmit() {
    setIsPending(true);
    const fd = new FormData();
    fd.append("displayName", displayName);
    fd.append("workspaceName", workspaceName);
    fd.append("goal", goal);
    await completeOnboarding(fd);
    // redirect is handled server-side; setIsPending stays true during navigation
  }

  async function handleSkip() {
    setIsSkipping(true);
    await skipOnboarding();
  }

  return (
    <div className="w-full max-w-md">
      {/* ── Step progress indicator ── */}
      <div className="mb-8 flex items-center justify-center gap-2">
        {STEPS.map((label, idx) => {
          const num = idx + 1;
          const isComplete = step > num;
          const isCurrent = step === num;
          return (
            <div key={label} className="flex items-center gap-2">
              {/* Step circle */}
              <div className="flex flex-col items-center gap-1">
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                    isComplete && "bg-primary text-primary-foreground",
                    isCurrent && "bg-primary text-primary-foreground",
                    !isComplete && !isCurrent && "bg-muted text-muted-foreground"
                  )}
                >
                  {isComplete ? "✓" : num}
                </span>
                <span
                  className={cn(
                    "hidden text-[10px] sm:block",
                    isCurrent ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {label}
                </span>
              </div>
              {/* Connector line */}
              {num < STEPS.length && (
                <span
                  className={cn(
                    "mb-4 h-px w-10 transition-colors",
                    step > num ? "bg-primary" : "bg-border"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* ── Step 1: About you ── */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Welcome to Planify</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Let&apos;s start with your name.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <label className="mb-1.5 block text-sm font-medium" htmlFor="displayName">
              Display name
            </label>
            <input
              id="displayName"
              type="text"
              autoFocus
              placeholder="Alex Summers"
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                if (errors.displayName) setErrors({});
              }}
              className={cn(
                "w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring",
                errors.displayName ? "border-destructive" : "border-input"
              )}
            />
            {errors.displayName && (
              <p className="mt-1 text-xs text-destructive">{errors.displayName}</p>
            )}
            <p className="mt-1.5 text-xs text-muted-foreground">
              This is how you&apos;ll appear to teammates.
            </p>
          </div>
        </div>
      )}

      {/* ── Step 2: Workspace ── */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Name your workspace</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              This is your team&apos;s home in Planify.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <label className="mb-1.5 block text-sm font-medium" htmlFor="workspaceName">
              Workspace name
            </label>
            <input
              id="workspaceName"
              type="text"
              autoFocus
              placeholder="Acme Inc."
              value={workspaceName}
              onChange={(e) => {
                setWorkspaceName(e.target.value);
                if (errors.workspaceName) setErrors({});
              }}
              className={cn(
                "w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring",
                errors.workspaceName ? "border-destructive" : "border-input"
              )}
            />
            {errors.workspaceName && (
              <p className="mt-1 text-xs text-destructive">{errors.workspaceName}</p>
            )}
            <p className="mt-1.5 text-xs text-muted-foreground">
              You can change this any time in workspace settings.
            </p>
          </div>
        </div>
      )}

      {/* ── Step 3: Goal ── */}
      {step === 3 && (
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">What&apos;s your primary goal?</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              We&apos;ll tailor your experience based on how you plan to use Planify.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {GOALS.map(({ id, label, description, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setGoal(id)}
                className={cn(
                  "flex items-start gap-4 rounded-xl border p-4 text-left transition-colors",
                  goal === id
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border bg-card hover:bg-accent"
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                    goal === id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-medium">{label}</p>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Actions ── */}
      <div className="mt-6 flex flex-col gap-3">
        <Button
          onClick={handleContinue}
          disabled={isPending || isSkipping}
          className="w-full"
          size="lg"
        >
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <>
              {step === 3 ? "Finish setup" : "Continue"}
              <ArrowRight className="ml-1 h-4 w-4" />
            </>
          )}
        </Button>

        <Button
          variant="ghost"
          onClick={handleSkip}
          disabled={isPending || isSkipping}
          className="w-full text-muted-foreground"
        >
          {isSkipping ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Skip for now — go to Dashboard
        </Button>
      </div>
    </div>
  );
}
