import { sql } from "./db";
import type { Project } from "./projects";

export type WeeklyBucket = {
  week_start: string; // YYYY-MM-DD (Monday)
  completed: number;
  total: number;
  rate: number; // 0-100
};

export type HeatmapDay = {
  date: string; // YYYY-MM-DD
  count: number;
};

export type AnalyticsSummary = {
  streak: number;
  completionRate: number; // overall, 0-100
  tasksThisWeek: number; // done tasks created this week
  tasksLastWeek: number; // done tasks created last week
  weeklyData: WeeklyBucket[]; // last 8 weeks
  projectBreakdown: Pick<
    Project,
    | "id"
    | "name"
    | "color"
    | "completion_pct"
    | "completed_tasks"
    | "total_tasks"
  >[];
  heatmap: HeatmapDay[]; // current calendar month
};

// ── Read ────────────────────────────────────────────────────────────────────

export async function getAnalyticsSummary(
  userId: string,
  currentDate?: Date,
  _timeZone?: string,
): Promise<AnalyticsSummary> {
  // Use provided date or default to now (local time)
  const now = currentDate ? new Date(currentDate) : new Date();

  // Use local time consistently - this matches what the client displays
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const firstDayOfNextMonth = new Date(year, month + 1, 1);

  // Activity heatmap date range - use parameters to match client's timezone
  const monthStart = firstDayOfMonth.toISOString();
  const monthEnd = firstDayOfNextMonth.toISOString();

  const [statsRow, weeklyRows, heatmapRows, projectRows, streakRow] =
    await Promise.all([
      // Overall stats + this/last week
      sql`
      SELECT
        COUNT(*) FILTER (WHERE status = 'done')::float /
          NULLIF(COUNT(*), 0) * 100                                   AS completion_rate,
        COUNT(*) FILTER (
          WHERE status = 'done'
            AND date_trunc('week', created_at) = date_trunc('week', CURRENT_DATE)
        )                                                             AS this_week,
        COUNT(*) FILTER (
          WHERE status = 'done'
            AND date_trunc('week', created_at) =
                date_trunc('week', CURRENT_DATE) - INTERVAL '1 week'
        )                                                             AS last_week
      FROM tasks
      WHERE user_id = ${userId}
    `,

      // 8-week rolling completion buckets using generate_series
      sql`
      SELECT
        gs.week_start,
        COUNT(t.id) FILTER (WHERE t.status = 'done')  AS completed,
        COUNT(t.id)                                    AS total
      FROM (
        SELECT generate_series(
          date_trunc('week', CURRENT_DATE) - INTERVAL '7 weeks',
          date_trunc('week', CURRENT_DATE),
          INTERVAL '1 week'
        )::date AS week_start
      ) gs
      LEFT JOIN tasks t
        ON t.user_id = ${userId}
        AND date_trunc('week', t.created_at)::date = gs.week_start
      GROUP BY gs.week_start
      ORDER BY gs.week_start
    `,

      // Activity heatmap — current calendar month
      // Use parameters to match client's timezone
      sql`
      SELECT created_at::date AS date, COUNT(*) AS count
      FROM tasks
      WHERE user_id = ${userId}
        AND created_at >= ${monthStart}::timestamptz
        AND created_at <  ${monthEnd}::timestamptz
      GROUP BY 1
      ORDER BY 1
    `,

      // Project breakdown
      sql`
      SELECT
        p.id, p.name, p.color,
        COUNT(t.id)                                      AS total_tasks,
        COUNT(t.id) FILTER (WHERE t.status = 'done')     AS completed_tasks,
        CASE WHEN COUNT(t.id) = 0 THEN 0
             ELSE ROUND(COUNT(t.id) FILTER (WHERE t.status = 'done') * 100.0 / COUNT(t.id))
        END                                              AS completion_pct
      FROM projects p
      LEFT JOIN tasks t ON t.project_id = p.id
      WHERE p.user_id = ${userId} AND p.status != 'archived'
      GROUP BY p.id
      ORDER BY completion_pct DESC
    `,

      // Day streak — consecutive days with any task activity ending today
      sql`
      WITH activity AS (
        SELECT DISTINCT created_at::date AS day
        FROM tasks
        WHERE user_id = ${userId}
      ),
      gaps AS (
        SELECT day,
               day - (ROW_NUMBER() OVER (ORDER BY day) || ' days')::interval AS grp
        FROM activity
      ),
      runs AS (
        SELECT grp, MAX(day) AS last_day, COUNT(*) AS len
        FROM gaps
        GROUP BY grp
      )
      SELECT COALESCE(
        (SELECT len FROM runs WHERE last_day >= CURRENT_DATE - 1 ORDER BY last_day DESC LIMIT 1),
        0
      ) AS streak
    `,
    ]);

  const stats = statsRow[0] ?? {};
  const streakVal = streakRow[0] ?? {};

  const result: AnalyticsSummary = {
    streak: Number(streakVal.streak ?? 0),
    completionRate: Math.round(Number(stats.completion_rate ?? 0)),
    tasksThisWeek: Number(stats.this_week ?? 0),
    tasksLastWeek: Number(stats.last_week ?? 0),

    weeklyData: weeklyRows.map((r) => {
      const completed = Number(r.completed ?? 0);
      const total = Number(r.total ?? 0);
      const weekStart = r.week_start;
      // Handle both string and Date objects from PostgreSQL
      const weekStartStr =
        weekStart instanceof Date
          ? weekStart.toISOString().slice(0, 10)
          : String(weekStart).slice(0, 10);
      return {
        week_start: weekStartStr,
        completed,
        total,
        rate: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    }),

    projectBreakdown: projectRows.map((r) => ({
      id: String(r.id),
      name: String(r.name),
      color: String(r.color),
      total_tasks: Number(r.total_tasks),
      completed_tasks: Number(r.completed_tasks),
      completion_pct: Number(r.completion_pct),
    })),

    heatmap: heatmapRows.map((r) => {
      // Parse the date string properly - convert UTC to local timezone
      const rawDate = r.date;
      let dateStr: string;

      if (rawDate instanceof Date) {
        // Handle Date objects from PostgreSQL - convert to local date string
        dateStr = rawDate.toLocaleDateString("en-CA");
      } else if (typeof rawDate === "string") {
        // Handle ISO strings - parse and convert to local date
        const parsed = new Date(rawDate);
        if (!isNaN(parsed.getTime())) {
          dateStr = parsed.toLocaleDateString("en-CA");
        } else {
          dateStr = rawDate.slice(0, 10);
        }
      } else {
        dateStr = String(rawDate).slice(0, 10);
      }

      return {
        date: dateStr,
        count: Number(r.count),
      };
    }),
  };

  return result;
}
