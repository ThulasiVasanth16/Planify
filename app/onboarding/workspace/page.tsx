import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getWorkspaceByUserId } from "@/lib/workspace";
import { OnboardingForm } from "../_components/onboarding-form";

export default async function OnboardingWorkspacePage() {
  const { userId } = await auth();

  // If no user, redirect to sign in
  if (!userId) {
    redirect("/sign-in");
  }

  // If workspace already exists, redirect to dashboard
  const workspace = await getWorkspaceByUserId(userId);
  if (workspace) {
    redirect("/dashboard");
  }

  // Show the multi-step onboarding form
  return (
    <div className='flex min-h-screen flex-col items-center justify-center bg-background px-6'>
      <OnboardingForm />
    </div>
  );
}
