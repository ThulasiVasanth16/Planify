"use server";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { updateWorkspaceName, updateWorkspaceSettings, type WorkspaceSettings } from "@/lib/workspace";

export async function saveWorkspaceName(name: string): Promise<{ error?: string }> {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const trimmed = name.trim();
  if (!trimmed) return { error: "Workspace name cannot be empty." };
  if (trimmed.length > 80) return { error: "Name must be 80 characters or fewer." };

  try {
    await updateWorkspaceName(userId, trimmed);
    revalidatePath("/settings/workspace");
    return {};
  } catch {
    return { error: "Failed to save workspace name." };
  }
}

export async function saveWorkspaceSettings(settings: WorkspaceSettings): Promise<{ error?: string }> {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  try {
    await updateWorkspaceSettings(userId, settings);

    // Persist theme in a cookie so SSR can apply the correct class without flash
    const jar = await cookies();
    jar.set("theme", settings.theme, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: "lax",
    });

    revalidatePath("/settings/workspace");
    return {};
  } catch {
    return { error: "Failed to save settings." };
  }
}
