import { sql } from "./db";

export type TeamMember = {
  id: string;
  workspace_id: string;
  user_id: string | null;
  display_name: string;
  email: string;
  role: "admin" | "member";
  status: "active" | "pending";
  invited_by: string;
  created_at: string;
};

export type TeamTask = {
  id: string;
  user_id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  project_name: string | null;
  assignee_id: string | null;
  assignee_name: string | null;
  created_at: string;
};

export type TeamStats = {
  total: number;
  completed: number;
  in_progress: number;
  overdue: number;
};

// ── Read ────────────────────────────────────────────────────────────────────

/** All team members for a workspace (invited members only — owner shown separately). */
export async function getTeamMembers(workspaceId: string): Promise<TeamMember[]> {
  try {
    const rows = await sql`
      SELECT id, workspace_id, user_id, display_name, email, role, status, invited_by, created_at::text
      FROM team_members
      WHERE workspace_id = ${workspaceId}
      ORDER BY created_at ASC
    `;
    return rows as TeamMember[];
  } catch {
    return [];
  }
}

/**
 * All tasks for the workspace, with assignee display name resolved from team_members.
 * Optional assigneeId filters to tasks assigned to that specific member.
 */
export async function getTeamTasks(
  userId: string,
  workspaceId: string,
  assigneeId: string | null = null
): Promise<TeamTask[]> {
  try {
    const rows = await sql`
      SELECT
        t.id, t.user_id, t.title, t.status, t.priority,
        t.due_date::text, t.created_at::text,
        t.assignee_id,
        p.name AS project_name,
        tm.display_name AS assignee_name
      FROM tasks t
      LEFT JOIN projects p ON p.id = t.project_id
      LEFT JOIN team_members tm
        ON tm.user_id = t.assignee_id AND tm.workspace_id = ${workspaceId}
      WHERE t.user_id = ${userId}
        AND (${assigneeId}::text IS NULL OR t.assignee_id = ${assigneeId})
      ORDER BY
        CASE WHEN t.status != 'done' THEN 0 ELSE 1 END,
        t.due_date ASC NULLS LAST,
        t.created_at DESC
    `;
    return rows as TeamTask[];
  } catch {
    return [];
  }
}

/** Aggregated stats for the team task table header cards. */
export async function getTeamStats(userId: string): Promise<TeamStats> {
  try {
    const [row] = await sql`
      SELECT
        COUNT(*)                                                          AS total,
        COUNT(*) FILTER (WHERE status = 'done')                          AS completed,
        COUNT(*) FILTER (WHERE status IN ('in_progress', 'in_review'))   AS in_progress,
        COUNT(*) FILTER (WHERE due_date < CURRENT_DATE AND status != 'done') AS overdue
      FROM tasks
      WHERE user_id = ${userId}
    `;
    return {
      total:       Number(row?.total       ?? 0),
      completed:   Number(row?.completed   ?? 0),
      in_progress: Number(row?.in_progress ?? 0),
      overdue:     Number(row?.overdue     ?? 0),
    };
  } catch {
    return { total: 0, completed: 0, in_progress: 0, overdue: 0 };
  }
}

// ── Write ───────────────────────────────────────────────────────────────────

export async function inviteMember({
  workspaceId,
  invitedBy,
  displayName,
  email,
  role = "member",
}: {
  workspaceId: string;
  invitedBy: string;
  displayName: string;
  email: string;
  role?: "admin" | "member";
}): Promise<TeamMember> {
  const [row] = await sql`
    INSERT INTO team_members (workspace_id, invited_by, display_name, email, role, status)
    VALUES (${workspaceId}, ${invitedBy}, ${displayName}, ${email}, ${role}, 'pending')
    ON CONFLICT (workspace_id, email) DO UPDATE
      SET display_name = EXCLUDED.display_name,
          role = EXCLUDED.role
    RETURNING id, workspace_id, user_id, display_name, email, role, status, invited_by, created_at::text
  `;
  return row as TeamMember;
}

export async function removeMember(memberId: string, workspaceId: string): Promise<boolean> {
  const result = await sql`
    DELETE FROM team_members
    WHERE id = ${memberId} AND workspace_id = ${workspaceId}
    RETURNING id
  `;
  return result.length > 0;
}

export async function updateMemberRole(
  memberId: string,
  workspaceId: string,
  role: "admin" | "member"
): Promise<boolean> {
  const result = await sql`
    UPDATE team_members SET role = ${role}
    WHERE id = ${memberId} AND workspace_id = ${workspaceId}
    RETURNING id
  `;
  return result.length > 0;
}
