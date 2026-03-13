import { sql } from "./db";

export type Project = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  status: string;
  color: string;
  created_at: string;
  total_tasks: number;
  completed_tasks: number;
  completion_pct: number;
};

export type ProjectMember = {
  id: string;
  project_id: string;
  member_id: string;
  created_at: string;
};

// ── Write ───────────────────────────────────────────────────────────────────

export async function createProject({
  userId,
  name,
  description = null,
  color = "#6366f1",
}: {
  userId: string;
  name: string;
  description?: string | null;
  color?: string;
}): Promise<Project> {
  const [row] = await sql`
    INSERT INTO projects (user_id, name, description, color, status)
    VALUES (${userId}, ${name}, ${description}, ${color}, 'active')
    RETURNING id, user_id, name, description, status, color, created_at::text
  `;
  return {
    ...row,
    total_tasks: 0,
    completed_tasks: 0,
    completion_pct: 0,
  } as Project;
}

/** Set project status to 'archived' — tasks remain, project hidden from active views. */
export async function archiveProject(
  projectId: string,
  userId: string,
): Promise<boolean> {
  const result = await sql`
    UPDATE projects SET status = 'archived'
    WHERE id = ${projectId} AND user_id = ${userId}
    RETURNING id
  `;
  return result.length > 0;
}

/** Permanently delete a project. Tasks are unlinked (project_id SET NULL) via FK constraint. */
export async function deleteProject(
  projectId: string,
  userId: string,
): Promise<boolean> {
  const result = await sql`
    DELETE FROM projects WHERE id = ${projectId} AND user_id = ${userId}
    RETURNING id
  `;
  return result.length > 0;
}

// ── Read ────────────────────────────────────────────────────────────────────

/** Single project by ID with completion stats. Returns null if not found. */
export async function getProjectById(
  projectId: string,
  userId: string,
): Promise<Project | null> {
  try {
    const [row] = await sql`
      SELECT
        p.id, p.user_id, p.name, p.description, p.status, p.color, p.created_at::text,
        COUNT(t.id)                                       AS total_tasks,
        COUNT(t.id) FILTER (WHERE t.status = 'done')     AS completed_tasks,
        CASE WHEN COUNT(t.id) = 0 THEN 0
             ELSE ROUND(COUNT(t.id) FILTER (WHERE t.status = 'done') * 100.0 / COUNT(t.id))
        END                                               AS completion_pct
      FROM projects p
      LEFT JOIN tasks t ON t.project_id = p.id
      WHERE p.id = ${projectId} AND p.user_id = ${userId}
      GROUP BY p.id
    `;
    if (!row) return null;
    return {
      ...row,
      total_tasks: Number(row.total_tasks),
      completed_tasks: Number(row.completed_tasks),
      completion_pct: Number(row.completion_pct),
    } as Project;
  } catch (err) {
    console.error("getProjectById error:", err);
    return null;
  }
}

/** Minimal project list — id + name only, for dropdowns. */
export async function getProjectNames(
  userId: string,
): Promise<{ id: string; name: string }[]> {
  try {
    const rows = await sql`
      SELECT id, name FROM projects
      WHERE user_id = ${userId} AND status != 'archived'
      ORDER BY name ASC
    `;
    return rows as { id: string; name: string }[];
  } catch {
    return [];
  }
}

/** All active projects for a user, with per-project task completion stats. */
export async function getProjectsWithProgress(
  userId: string,
): Promise<Project[]> {
  try {
    const rows = await sql`
      SELECT
        p.id, p.user_id, p.name, p.description, p.status, p.color, p.created_at::text,
        COUNT(t.id)                                       AS total_tasks,
        COUNT(t.id) FILTER (WHERE t.status = 'done')     AS completed_tasks,
        CASE WHEN COUNT(t.id) = 0 THEN 0
             ELSE ROUND(COUNT(t.id) FILTER (WHERE t.status = 'done') * 100.0 / COUNT(t.id))
        END                                               AS completion_pct
      FROM projects p
      LEFT JOIN tasks t ON t.project_id = p.id
      WHERE p.user_id = ${userId}
        AND p.status != 'archived'
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `;
    return rows.map((r) => ({
      ...r,
      total_tasks: Number(r.total_tasks),
      completed_tasks: Number(r.completed_tasks),
      completion_pct: Number(r.completion_pct),
    })) as Project[];
  } catch (err) {
    console.error("getProjectsWithProgress error:", err);
    return [];
  }
}

// ── Project Members ──────────────────────────────────────────────────────────

/** Add a team member to a project */
export async function addProjectMember({
  projectId,
  memberId,
}: {
  projectId: string;
  memberId: string;
}): Promise<boolean> {
  try {
    await sql`
      INSERT INTO project_members (project_id, member_id)
      VALUES (${projectId}, ${memberId})
      ON CONFLICT (project_id, member_id) DO NOTHING
    `;
    return true;
  } catch {
    return false;
  }
}

/** Remove a team member from a project */
export async function removeProjectMember({
  projectId,
  memberId,
}: {
  projectId: string;
  memberId: string;
}): Promise<boolean> {
  try {
    await sql`
      DELETE FROM project_members
      WHERE project_id = ${projectId} AND member_id = ${memberId}
    `;
    return true;
  } catch {
    return false;
  }
}

/** Get all team members assigned to a project */
export async function getProjectMembers(projectId: string): Promise<
  {
    member_id: string;
    user_id: string;
    display_name: string;
    email: string;
    role: string;
  }[]
> {
  try {
    const rows = await sql`
      SELECT 
        tm.id as member_id, 
        tm.user_id, 
        tm.display_name, 
        tm.email, 
        tm.role
      FROM project_members pm
      JOIN team_members tm ON tm.id = pm.member_id
      WHERE pm.project_id = ${projectId}
      ORDER BY tm.display_name ASC
    `;
    return rows as unknown as {
      member_id: string;
      user_id: string;
      display_name: string;
      email: string;
      role: string;
    }[];
  } catch {
    return [];
  }
}

/** Get all active team members NOT assigned to a project */
export async function getAvailableTeamMembers(
  workspaceId: string,
  projectId: string,
): Promise<
  {
    member_id: string;
    user_id: string;
    display_name: string;
    email: string;
    role: string;
  }[]
> {
  try {
    const rows = await sql`
      SELECT 
        tm.id as member_id, 
        tm.user_id, 
        tm.display_name, 
        tm.email, 
        tm.role
      FROM team_members tm
      WHERE tm.workspace_id = ${workspaceId}
        AND tm.status = 'active'
        AND tm.id NOT IN (
          SELECT member_id FROM project_members WHERE project_id = ${projectId}
        )
      ORDER BY tm.display_name ASC
    `;
    return rows as unknown as {
      member_id: string;
      user_id: string;
      display_name: string;
      email: string;
      role: string;
    }[];
  } catch {
    return [];
  }
}
