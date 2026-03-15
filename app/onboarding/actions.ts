"use server";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createWorkspaceAndProfile, getUserEmail } from "@/lib/workspace";
import { sql } from "@/lib/db";

export async function completeOnboarding(formData: FormData) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // Check if user was invited to an existing workspace
  const userEmail = await getUserEmail(userId);
  console.log("[completeOnboarding] UserId:", userId, "Email:", userEmail);

  if (userEmail) {
    // Check for pending invitation (case-insensitive)
    const [invitation] = await sql`
      SELECT id, workspace_id FROM team_members
      WHERE LOWER(email) = LOWER(${userEmail}) AND status = 'pending' AND user_id IS NULL
      LIMIT 1
    `;

    console.log("[completeOnboarding] Found invitation:", !!invitation);

    if (invitation) {
      // User was invited - link them to the existing workspace
      const displayName = (formData.get("displayName") as string)?.trim();
      console.log(
        "[completeOnboarding] Linking user to workspace:",
        invitation.workspace_id,
      );

      // Update user profile
      await sql`
        INSERT INTO user_profiles (user_id, display_name)
        VALUES (${userId}, ${displayName})
        ON CONFLICT (user_id) DO UPDATE SET display_name = EXCLUDED.display_name
      `;

      // Update team_member to mark as active
      await sql`
        UPDATE team_members 
        SET user_id = ${userId}, status = 'active'
        WHERE id = ${invitation.id}
      `;

      redirect("/dashboard");
    }
  }

  console.log(
    "[completeOnboarding] No invitation found, creating new workspace",
  );

  // No invitation found - create new workspace (existing behavior)
  const displayName = (formData.get("displayName") as string)?.trim();
  const workspaceName = (formData.get("workspaceName") as string)?.trim();
  const goal = (formData.get("goal") as string) ?? "professional";

  if (!displayName || !workspaceName) {
    return;
  }

  await createWorkspaceAndProfile({ userId, displayName, workspaceName, goal });
  redirect("/dashboard");
}

export async function skipOnboarding() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // Check if user was invited to an existing workspace
  const userEmail = await getUserEmail(userId);
  if (userEmail) {
    const [invitation] = await sql`
      SELECT id, workspace_id FROM team_members
      WHERE email = ${userEmail} AND status = 'pending' AND user_id IS NULL
      LIMIT 1
    `;

    if (invitation) {
      // User was invited - link them to the existing workspace
      await sql`
        INSERT INTO user_profiles (user_id, display_name)
        VALUES (${userId}, 'User')
        ON CONFLICT (user_id) DO UPDATE SET display_name = EXCLUDED.display_name
      `;

      await sql`
        UPDATE team_members 
        SET user_id = ${userId}, status = 'active'
        WHERE id = ${invitation.id}
      `;

      redirect("/dashboard");
    }
  }

  // No invitation found - create new workspace
  await createWorkspaceAndProfile({
    userId,
    displayName: "User",
    workspaceName: "My Workspace",
    goal: "professional",
  });

  redirect("/dashboard");
}
