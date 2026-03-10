"use server";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createWorkspaceAndProfile } from "@/lib/workspace";

export async function completeOnboarding(formData: FormData) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const displayName = (formData.get("displayName") as string)?.trim();
  const workspaceName = (formData.get("workspaceName") as string)?.trim();
  const goal = (formData.get("goal") as string) ?? "professional";

  if (!displayName || !workspaceName) {
    // Return early — client validation should prevent this, but guard server-side too
    return;
  }

  await createWorkspaceAndProfile({ userId, displayName, workspaceName, goal });
  redirect("/dashboard");
}

export async function skipOnboarding() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // Create a default workspace so the app is never in a broken state
  await createWorkspaceAndProfile({
    userId,
    displayName: "User",
    workspaceName: "My Workspace",
    goal: "professional",
  });

  redirect("/dashboard");
}
