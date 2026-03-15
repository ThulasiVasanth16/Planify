// import { sql } from "./db";

// const test = await sql`SELECT NOW()`;
// console.log(test);
import { sql } from "./db";

/** Owner's display_name for the team member list. */
export async function getWorkspaceOwnerProfile(
  userId: string,
): Promise<{ user_id: string; display_name: string } | null> {
  const rows = await sql`
    SELECT user_id, display_name FROM user_profiles WHERE user_id = ${userId} LIMIT 1
  `;
  return (rows[0] as { user_id: string; display_name: string }) ?? null;
}

/** Get user's primary email address from Clerk */
export async function getUserEmail(userId: string): Promise<string | null> {
  const { currentUser } = await import("@clerk/nextjs/server");
  const user = await currentUser();
  if (!user) return null;

  const email = user.emailAddresses.find(
    (e) => e.id === user.primaryEmailAddressId,
  )?.emailAddress;

  return email ?? null;
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

export async function getWorkspaceByUserId(
  userId: string,
): Promise<Workspace | null> {
  // First check if user owns a workspace
  const ownerRows = await sql`
    SELECT id, name, slug, goal, created_at::text
    FROM workspaces
    WHERE user_id = ${userId}
    LIMIT 1
  `;

  if (ownerRows.length > 0) {
    return ownerRows[0] as Workspace;
  }

  // Check if user is a team member of any workspace
  const memberRows = await sql`
    SELECT w.id, w.name, w.slug, w.goal, w.created_at::text
    FROM workspaces w
    JOIN team_members tm ON tm.workspace_id = w.id
    WHERE tm.user_id = ${userId} AND tm.status = 'active'
    LIMIT 1
  `;

  return (memberRows[0] as Workspace) ?? null;
}

export async function getWorkspaceWithSettings(
  userId: string,
): Promise<WorkspaceWithSettings | null> {
  // First check if user owns a workspace
  const ownerRows = await sql`
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

  if (ownerRows.length > 0) {
    const r = ownerRows[0];
    return {
      id: String(r.id),
      name: String(r.name),
      slug: String(r.slug),
      goal: r.goal,
      created_at: String(r.created_at),
      theme: String(r.theme) as "light" | "dark" | "system",
      email_digest: String(r.email_digest) as "daily" | "weekly" | "off",
      deadline_reminders: Boolean(r.deadline_reminders),
      default_priority: String(r.default_priority) as "low" | "medium" | "high",
      default_deadline: String(r.default_deadline) as
        | "none"
        | "today"
        | "tomorrow"
        | "week",
    };
  }

  // Check if user is a team member of any workspace
  const memberRows = await sql`
    SELECT
      w.id, w.name, w.slug, w.goal, w.created_at::text,
      COALESCE(w.theme, 'system')            AS theme,
      COALESCE(w.email_digest, 'weekly')     AS email_digest,
      COALESCE(w.deadline_reminders, true)   AS deadline_reminders,
      COALESCE(w.default_priority, 'medium') AS default_priority,
      COALESCE(w.default_deadline, 'none')   AS default_deadline
    FROM workspaces w
    JOIN team_members tm ON tm.workspace_id = w.id
    WHERE tm.user_id = ${userId} AND tm.status = 'active'
    LIMIT 1
  `;

  if (!memberRows[0]) return null;
  const r = memberRows[0];
  return {
    id: String(r.id),
    name: String(r.name),
    slug: String(r.slug),
    goal: r.goal,
    created_at: String(r.created_at),
    theme: String(r.theme) as "light" | "dark" | "system",
    email_digest: String(r.email_digest) as "daily" | "weekly" | "off",
    deadline_reminders: Boolean(r.deadline_reminders),
    default_priority: String(r.default_priority) as "low" | "medium" | "high",
    default_deadline: String(r.default_deadline) as
      | "none"
      | "today"
      | "tomorrow"
      | "week",
  };
}

export async function updateWorkspaceName(
  userId: string,
  name: string,
): Promise<void> {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  await sql`UPDATE workspaces SET name = ${name}, slug = ${slug} WHERE user_id = ${userId}`;
}

export async function updateWorkspaceSettings(
  userId: string,
  settings: WorkspaceSettings,
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
