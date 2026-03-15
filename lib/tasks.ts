import { sql } from "./db";

export type TaskStatus = "todo" | "in_progress" | "in_review" | "done";
export type TaskPriority = "low" | "medium" | "high";

export type Task = {
  id: string;
  user_id: string;
  project_id: string | null;
  project_name: string | null;
  title: string;
  description: string | null;
  notes: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  assignee_id: string | null;
  created_at: string;
};

export type DashboardStats = {
  due_today: number;
  in_progress: number;
  completed: number;
  overdue: number;
  due_this_week: number;
};

export type TaskFilters = {
  priority?: string | null;
  project?: string | null;
  sort?: string | null;
};

// ── Read ────────────────────────────────────────────────────────────────────

/** Top 5 high-priority, non-done tasks for the Priority Queue panel. */
export async function getPriorityTasks(userId: string): Promise<Task[]> {
  try {
    const rows = await sql`
      SELECT
        t.id, t.user_id, t.project_id, p.name AS project_name,
        t.title, t.description, t.notes, t.assignee_id,
        t.status, t.priority, t.due_date::text, t.created_at::text
      FROM tasks t
      LEFT JOIN projects p ON p.id = t.project_id
      WHERE t.user_id = ${userId}
        AND t.priority = 'high'
        AND t.status != 'done'
      ORDER BY t.due_date ASC NULLS LAST, t.created_at ASC
      LIMIT 5
    `;
    return rows as Task[];
  } catch {
    return [];
  }
}

/** Aggregated stat counts for the dashboard summary cards. */
export async function getDashboardStats(
  userId: string,
): Promise<DashboardStats> {
  try {
    const [row] = await sql`
      SELECT
        COUNT(*) FILTER (WHERE due_date = CURRENT_DATE AND status != 'done')     AS due_today,
        COUNT(*) FILTER (WHERE status = 'in_progress')                           AS in_progress,
        COUNT(*) FILTER (WHERE status = 'done')                                  AS completed,
        COUNT(*) FILTER (WHERE due_date < CURRENT_DATE AND status != 'done')     AS overdue,
        COUNT(*) FILTER (
          WHERE due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 6
            AND status != 'done'
        )                                                                        AS due_this_week
      FROM tasks
      WHERE user_id = ${userId}
    `;
    return {
      due_today: Number(row?.due_today ?? 0),
      in_progress: Number(row?.in_progress ?? 0),
      completed: Number(row?.completed ?? 0),
      overdue: Number(row?.overdue ?? 0),
      due_this_week: Number(row?.due_this_week ?? 0),
    };
  } catch {
    return {
      due_today: 0,
      in_progress: 0,
      completed: 0,
      overdue: 0,
      due_this_week: 0,
    };
  }
}

/**
 * All tasks for a user with optional priority/project filters and sort order.
 * Filter values map directly to URL query params so the URL is the source of truth.
 */
export async function getTasksFiltered(
  userId: string,
  { priority = null, project = null, sort = "created" }: TaskFilters = {},
): Promise<Task[]> {
  try {
    const rows = await sql`
      SELECT
        t.id, t.user_id, t.project_id, p.name AS project_name,
        t.title, t.description, t.notes, t.assignee_id,
        t.status, t.priority, t.due_date::text, t.created_at::text
      FROM tasks t
      LEFT JOIN projects p ON p.id = t.project_id
      WHERE t.user_id = ${userId}
        AND (${priority}::text IS NULL OR t.priority = ${priority})
        AND (${project}::text  IS NULL OR t.project_id = ${project}::uuid)
      ORDER BY
        CASE WHEN ${sort} = 'deadline_asc'  THEN t.due_date END ASC  NULLS LAST,
        CASE WHEN ${sort} = 'deadline_desc' THEN t.due_date END DESC NULLS LAST,
        CASE WHEN ${sort} = 'priority'
          THEN CASE t.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END
        END ASC NULLS LAST,
        t.created_at DESC
    `;
    return rows as Task[];
  } catch {
    return [];
  }
}

/** Single task by ID — verifies ownership via user_id. Returns null if not found. */
export async function getTaskById(
  taskId: string,
  userId: string,
): Promise<Task | null> {
  try {
    const [row] = await sql`
      SELECT
        t.id, t.user_id, t.project_id, p.name AS project_name,
        t.title, t.description, t.notes, t.assignee_id,
        t.status, t.priority, t.due_date::text, t.created_at::text
      FROM tasks t
      LEFT JOIN projects p ON p.id = t.project_id
      WHERE t.id = ${taskId} AND t.user_id = ${userId}
    `;
    return row ? (row as Task) : null;
  } catch {
    return null;
  }
}

// ── Write ───────────────────────────────────────────────────────────────────

export async function createTask({
  userId,
  title,
  status = "todo",
  priority = "medium",
  projectId = null,
  dueDate = null,
  description = null,
  assigneeId = null,
}: {
  userId: string;
  title: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  projectId?: string | null;
  dueDate?: string | null;
  description?: string | null;
  assigneeId?: string | null;
}): Promise<Task> {
  const [row] = await sql`
    INSERT INTO tasks (user_id, title, status, priority, project_id, due_date, description, assignee_id)
    VALUES (
      ${userId}, ${title}, ${status}, ${priority},
      ${projectId}::uuid, ${dueDate}::date, ${description}, ${assigneeId}
    )
    RETURNING id, user_id, project_id, title, description, notes, assignee_id,
              status, priority, due_date::text, created_at::text
  `;
  return { ...row, project_name: null } as Task;
}

/** Update a single task's status — used by optimistic toggle in TaskBoard. */
export async function updateTaskStatus(
  taskId: string,
  userId: string,
  status: string,
): Promise<boolean> {
  const result = await sql`
    UPDATE tasks SET status = ${status}
    WHERE id = ${taskId} AND user_id = ${userId}
    RETURNING id
  `;
  return result.length > 0;
}

export type TaskUpdate = {
  title: string;
  description: string | null;
  notes: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string | null;
  dueDate: string | null;
};

/** Full task update — used by the Task Detail page Save Changes action. */
export async function updateTask(
  taskId: string,
  userId: string,
  {
    title,
    description,
    notes,
    status,
    priority,
    projectId,
    dueDate,
  }: TaskUpdate,
): Promise<Task | null> {
  const [row] = await sql`
    UPDATE tasks
    SET
      title       = ${title},
      description = ${description},
      notes       = ${notes},
      status      = ${status},
      priority    = ${priority},
      project_id  = ${projectId}::uuid,
      due_date    = ${dueDate}::date
    WHERE id = ${taskId} AND user_id = ${userId}
    RETURNING id, user_id, project_id, title, description, notes, assignee_id,
              status, priority, due_date::text, created_at::text
  `;
  return row ? ({ ...row, project_name: null } as Task) : null;
}

/** Delete a task — used by DELETE /api/tasks/:id. */
export async function deleteTask(
  taskId: string,
  userId: string,
): Promise<boolean> {
  const result = await sql`
    DELETE FROM tasks WHERE id = ${taskId} AND user_id = ${userId}
    RETURNING id
  `;
  return result.length > 0;
}
