import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarClock, Loader, CheckCircle2, AlertCircle } from "lucide-react";
import type { DashboardStats } from "@/lib/tasks";

const CARDS = [
  {
    key: "due_today" as const,
    label: "Due Today",
    icon: CalendarClock,
    highlight: (v: number) => v > 0,
  },
  {
    key: "in_progress" as const,
    label: "In Progress",
    icon: Loader,
    highlight: () => false,
  },
  {
    key: "completed" as const,
    label: "Completed",
    icon: CheckCircle2,
    highlight: () => false,
  },
  {
    key: "overdue" as const,
    label: "Overdue",
    icon: AlertCircle,
    highlight: (v: number) => v > 0,
  },
];

export function StatCards({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {CARDS.map(({ key, label, icon: Icon, highlight }) => {
        const value = stats[key];
        const isHighlighted = highlight(value);
        return (
          <Card key={key} className={isHighlighted ? "border-destructive/40" : ""}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {label}
              </CardTitle>
              <Icon
                className={`h-4 w-4 ${isHighlighted ? "text-destructive" : "text-muted-foreground"}`}
              />
            </CardHeader>
            <CardContent>
              <p className={`text-3xl font-bold ${isHighlighted ? "text-destructive" : ""}`}>
                {value}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
