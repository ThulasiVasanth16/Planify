"use client";

import {
  Download,
  Flame,
  TrendingDown,
  TrendingUp,
  Target,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AnalyticsSummary } from "@/lib/analytics";

interface InsightsDashboardProps {
  summary: AnalyticsSummary;
}

/* ── Helpers ────────────────────────────────────────────────────────────── */

function shortWeek(dateStr: string): string {
  if (!dateStr || typeof dateStr !== "string") return "-";
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function exportCSV(summary: AnalyticsSummary) {
  const rows: string[][] = [
    ["Week", "Completed", "Total", "Rate (%)"],
    ...summary.weeklyData.map((w) => [
      w.week_start,
      String(w.completed),
      String(w.total),
      String(w.rate),
    ]),
    [],
    ["Project", "Completed Tasks", "Total Tasks", "Completion (%)"],
    ...summary.projectBreakdown.map((p) => [
      p.name,
      String(p.completed_tasks),
      String(p.total_tasks),
      String(p.completion_pct),
    ]),
    [],
    ["Metric", "Value"],
    ["Streak (days)", String(summary.streak)],
    ["Overall Completion Rate (%)", String(summary.completionRate)],
    ["Tasks Completed This Week", String(summary.tasksThisWeek)],
    ["Tasks Completed Last Week", String(summary.tasksLastWeek)],
  ];

  const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "planify-analytics.csv";
  a.click();
  URL.revokeObjectURL(url);
}

/* ── Component ──────────────────────────────────────────────────────────── */

export function InsightsDashboard({ summary }: InsightsDashboardProps) {
  const weekTrend = summary.tasksThisWeek - summary.tasksLastWeek;
  const trendUp = weekTrend >= 0;

  return (
    <div className='flex flex-col gap-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Insights</h1>
          <p className='text-sm text-muted-foreground'>
            Your personal productivity analytics.
          </p>
        </div>
        <Button variant='outline' size='sm' onClick={() => exportCSV(summary)}>
          <Download className='mr-1.5 h-3.5 w-3.5' /> Export CSV
        </Button>
      </div>

      {/* Stat cards */}
      <div className='grid grid-cols-2 gap-4 sm:grid-cols-4'>
        <StatCard
          label='Day Streak'
          value={`${summary.streak}`}
          sub='consecutive days'
          icon={<Flame className='h-4 w-4 text-orange-500' />}
          accent='orange'
        />
        <StatCard
          label='Completion Rate'
          value={`${summary.completionRate}%`}
          sub='all-time'
          icon={<Target className='h-4 w-4 text-primary' />}
        />
        <StatCard
          label='Tasks This Week'
          value={`${summary.tasksThisWeek}`}
          sub={
            <span
              className={cn(
                "flex items-center gap-0.5",
                trendUp ? "text-green-600" : "text-destructive",
              )}
            >
              {trendUp ? (
                <TrendingUp className='h-3 w-3' />
              ) : (
                <TrendingDown className='h-3 w-3' />
              )}
              {weekTrend >= 0 ? "+" : ""}
              {weekTrend} vs last week
            </span>
          }
          icon={<CalendarDays className='h-4 w-4 text-blue-500' />}
          accent='blue'
        />
        <StatCard
          label='Last Week'
          value={`${summary.tasksLastWeek}`}
          sub='tasks completed'
          icon={<CalendarDays className='h-4 w-4 text-muted-foreground' />}
        />
      </div>

      {/* Completion rate bar chart */}
      <div className='rounded-xl border border-border bg-card p-5'>
        <h2 className='mb-1 text-sm font-semibold'>Weekly Completion Rate</h2>
        <p className='mb-5 text-xs text-muted-foreground'>
          Rolling 8-week view — % of tasks completed each week
        </p>
        <BarChart data={summary.weeklyData} />
      </div>

      {/* Project breakdown + heatmap */}
      <div className='grid gap-4 lg:grid-cols-2'>
        {/* Project breakdown */}
        <div className='rounded-xl border border-border bg-card p-5'>
          <h2 className='mb-1 text-sm font-semibold'>Project Breakdown</h2>
          <p className='mb-4 text-xs text-muted-foreground'>
            Completion percentage per active project
          </p>
          {summary.projectBreakdown.length === 0 ? (
            <p className='py-6 text-center text-sm text-muted-foreground'>
              No projects yet.
            </p>
          ) : (
            <div className='flex flex-col gap-3'>
              {summary.projectBreakdown.map((p) => (
                <div key={p.id}>
                  <div className='mb-1 flex items-center justify-between text-xs'>
                    <span className='flex items-center gap-1.5 font-medium'>
                      <span
                        className='h-2 w-2 rounded-full'
                        style={{ backgroundColor: p.color }}
                      />
                      {p.name}
                    </span>
                    <span className='text-muted-foreground'>
                      {p.completed_tasks}/{p.total_tasks} · {p.completion_pct}%
                    </span>
                  </div>
                  <div className='h-2 w-full overflow-hidden rounded-full bg-muted'>
                    <div
                      className='h-full rounded-full transition-all duration-500'
                      style={{
                        width: `${p.completion_pct}%`,
                        backgroundColor: p.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity heatmap */}
        <div className='rounded-xl border border-border bg-card p-5'>
          <h2 className='mb-1 text-sm font-semibold'>Activity Heatmap</h2>
          <p className='mb-4 text-xs text-muted-foreground'>
            Tasks created this month — darker = more activity
          </p>
          <ActivityHeatmap heatmap={summary.heatmap} />
        </div>
      </div>
    </div>
  );
}

/* ── StatCard ────────────────────────────────────────────────────────────── */

function StatCard({
  label,
  value,
  sub,
  icon,
  accent,
}: {
  label: string;
  value: string;
  sub: React.ReactNode;
  icon: React.ReactNode;
  accent?: "orange" | "blue";
}) {
  return (
    <div className='rounded-xl border border-border bg-card p-4'>
      <div className='mb-2 flex items-center justify-between text-muted-foreground'>
        {icon}
        <span className='text-xs'>{label}</span>
      </div>
      <p
        className={cn(
          "text-2xl font-bold",
          accent === "orange" && "text-orange-500",
          accent === "blue" && "text-blue-600 dark:text-blue-400",
        )}
      >
        {value}
      </p>
      {/* <p className='mt-0.5 text-xs text-muted-foreground'>{sub}</p> */}
    </div>
  );
}

/* ── BarChart ────────────────────────────────────────────────────────────── */

function BarChart({
  data,
}: {
  data: {
    week_start: string;
    rate: number;
    completed: number;
    total: number;
  }[];
}) {
  const maxRate = Math.max(...data.map((d) => d.rate), 1);
  const chartH = 120;

  return (
    <div className='overflow-x-auto'>
      <div className='min-w-[400px]'>
        <svg width='100%' height={chartH + 40} className='overflow-visible'>
          {data.map((d, i) => {
            const barW = 28;
            const gap = 12;
            const x = i * (barW + gap) + gap / 2;
            const barH = Math.max(
              (d.rate / maxRate) * chartH,
              d.rate > 0 ? 4 : 0,
            );
            const y = chartH - barH;
            const isThis = i === data.length - 1;

            return (
              <g key={d.week_start}>
                {/* Bar */}
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={barH}
                  rx={3}
                  className={cn(
                    "transition-all duration-300",
                    isThis ? "fill-primary" : "fill-primary/40",
                  )}
                />
                {/* Rate label above bar */}
                {d.rate > 0 && (
                  <text
                    x={x + barW / 2}
                    y={y - 5}
                    textAnchor='middle'
                    className='fill-muted-foreground text-[10px]'
                    fontSize='10'
                  >
                    {d.rate}%
                  </text>
                )}
                {/* Week label below */}
                <text
                  x={x + barW / 2}
                  y={chartH + 18}
                  textAnchor='middle'
                  className='fill-muted-foreground text-[10px]'
                  fontSize='10'
                >
                  {shortWeek(d.week_start)}
                </text>
              </g>
            );
          })}
          {/* Baseline */}
          <line
            x1='0'
            y1={chartH}
            x2='100%'
            y2={chartH}
            className='stroke-border'
            strokeWidth='1'
          />
        </svg>
      </div>
    </div>
  );
}

/* ── ActivityHeatmap ─────────────────────────────────────────────────────── */

function ActivityHeatmap({
  heatmap,
}: {
  heatmap: { date: string; count: number }[];
}) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = new Date(year, month, 1).getDay(); // 0=Sun

  const countMap = new Map(heatmap.map((h) => [h.date, h.count]));
  const maxCount = Math.max(...heatmap.map((h) => h.count), 1);

  // Day-of-week headers
  const DOW = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  return (
    <div>
      {/* DOW headers */}
      <div className='mb-1 grid grid-cols-7 gap-1'>
        {DOW.map((d) => (
          <div
            key={d}
            className='text-center text-[10px] text-muted-foreground'
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className='grid grid-cols-7 gap-1'>
        {/* Leading empty cells */}
        {Array.from({ length: firstDow }).map((_, i) => (
          <div key={`empty-${i}`} className='aspect-square' />
        ))}

        {/* Day cells */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const count = countMap.get(dateStr) ?? 0;
          const intensity = count === 0 ? 0 : Math.max(0.15, count / maxCount);
          const isToday = dateStr === now.toISOString().slice(0, 10);
          const hasActivity = count > 0;

          return (
            <div
              key={day}
              className={cn(
                "aspect-square rounded-sm flex items-center justify-center text-[10px] transition-colors",
                isToday && "ring-1 ring-primary ring-offset-1",
                hasActivity ? "text-white" : "text-muted-foreground",
              )}
              style={{
                backgroundColor:
                  count > 0
                    ? `rgba(99, 102, 241, ${intensity})`
                    : "var(--muted)",
              }}
              title={`${dateStr}: ${count} task${count !== 1 ? "s" : ""}`}
            >
              {day}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className='mt-3 flex items-center gap-1.5'>
        <span className='text-[10px] text-muted-foreground'>Less</span>
        {[0, 0.2, 0.4, 0.7, 1].map((v) => (
          <div
            key={v}
            className='h-3 w-3 rounded-sm'
            style={{
              backgroundColor:
                v === 0 ? "var(--muted)" : `rgba(99, 102, 241, ${v})`,
            }}
          />
        ))}
        <span className='text-[10px] text-muted-foreground'>More</span>
      </div>
    </div>
  );
}
