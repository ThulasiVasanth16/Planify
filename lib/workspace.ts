// import { sql } from "./db";

// const test = await sql`SELECT NOW()`;
// console.log(test);
import { sql } from "./db";

/** Owner's display_name for the team member list. */
export async function getWorkspaceOwnerProfile(userId: string): Promise<{ user_id: string; display_name: string } | null> {
  const rows = await sql`
    SELECT user_id, display_name FROM user_profiles WHERE user_id = ${userId} LIMIT 1
  `;
  return (rows[0] as { user_id: string; display_name: string }) ?? null;
}

export type Workspace = {
  id: string;
  name: string;
  slug: string;
  goal: string | null;
  created_at: string;
};

export type WorkspaceSettings = {
  theme: "light" | "dark" | "system";
  email_digest: "daily" | "weekly" | "off";
  deadline_reminders: boolean;
  default_priority: "low" | "medium" | "high";
  default_deadline: "none" | "today" | "tomorrow" | "week";
};

export type WorkspaceWithSettings = Workspace & WorkspaceSettings;

export async function getWorkspaceByUserId(userId: string): Promise<Workspace | null> {
  const rows = await sql`
    SELECT id, name, slug, goal, created_at::text
    FROM workspaces
    WHERE user_id = ${userId}
    LIMIT 1
  `;
  return (rows[0] as Workspace) ?? null;
}

export async function getWorkspaceWithSettings(userId: string): Promise<WorkspaceWithSettings | null> {
  const rows = await sql`
    SELECT
      id, name, slug, goal, created_at::text,
      COALESCE(theme, 'system')            AS theme,
      COALESCE(email_digest, 'weekly')     AS email_digest,
      COALESCE(deadline_reminders, true)   AS deadline_reminders,
      COALESCE(default_priority, 'medium') AS default_priority,
      COALESCE(default_deadline, 'none')   AS default_deadline
    FROM workspaces
    WHERE user_id = ${userId}
    LIMIT 1
  `;
  if (!rows[0]) return null;
  const r = rows[0];
  return {
    id:                 String(r.id),
    name:               String(r.name),
    slug:               String(r.slug),
    goal:               r.goal ? String(r.goal) : null,
    created_at:         String(r.created_at),
    theme:              (r.theme as WorkspaceSettings["theme"])                ?? "system",
    email_digest:       (r.email_digest as WorkspaceSettings["email_digest"]) ?? "weekly",
    deadline_reminders: Boolean(r.deadline_reminders),
    default_priority:   (r.default_priority as WorkspaceSettings["default_priority"]) ?? "medium",
    default_deadline:   (r.default_deadline as WorkspaceSettings["default_deadline"]) ?? "none",
  };
}

export async function updateWorkspaceName(userId: string, name: string): Promise<void> {
  const slug = name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  await sql`UPDATE workspaces SET name = ${name}, slug = ${slug} WHERE user_id = ${userId}`;
}

export async function updateWorkspaceSettings(
  userId: string,
  settings: WorkspaceSettings
): Promise<void> {
  await sql`
    UPDATE workspaces
    SET
      theme              = ${settings.theme},
      email_digest       = ${settings.email_digest},
      deadline_reminders = ${settings.deadline_reminders},
      default_priority   = ${settings.default_priority},
      default_deadline   = ${settings.default_deadline}
    WHERE user_id = ${userId}
  `;
}

export async function createWorkspaceAndProfile({
  userId,
  displayName,
  workspaceName,
  goal,
}: {
  userId: string;
  displayName: string;
  workspaceName: string;
  goal: string;
}) {
  const slug = workspaceName
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

  await sql`
    INSERT INTO user_profiles (user_id, display_name)
    VALUES (${userId}, ${displayName})
    ON CONFLICT (user_id) DO UPDATE SET display_name = EXCLUDED.display_name
  `;

  await sql`
    INSERT INTO workspaces (user_id, name, slug, goal)
    VALUES (${userId}, ${workspaceName}, ${slug}, ${goal})
    ON CONFLICT (user_id) DO UPDATE
      SET name = EXCLUDED.name,
          slug = EXCLUDED.slug,
          goal = EXCLUDED.goal
  `;
}
