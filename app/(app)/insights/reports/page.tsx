import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, FileText, BarChart2, Users, Clock } from "lucide-react";
import Link from "next/link";

const reports = [
  {
    id: "velocity",
    title: "Team Velocity Report",
    description: "Tasks completed per sprint and team member productivity over time.",
    icon: BarChart2,
    lastGenerated: "Mar 6, 2026",
    frequency: "Weekly",
  },
  {
    id: "delivery",
    title: "Delivery & Deadlines",
    description: "On-time vs late delivery rates per project and assignee.",
    icon: Clock,
    lastGenerated: "Mar 1, 2026",
    frequency: "Monthly",
  },
  {
    id: "workload",
    title: "Workload Distribution",
    description: "Task assignments and capacity utilisation across team members.",
    icon: Users,
    lastGenerated: "Feb 28, 2026",
    frequency: "Monthly",
  },
  {
    id: "custom",
    title: "Custom Report",
    description: "Build a custom report by selecting metrics, filters, and date ranges.",
    icon: FileText,
    lastGenerated: "—",
    frequency: "On demand",
  },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div>
        <Button variant="ghost" size="sm" className="-ml-2 mb-3" asChild>
          <Link href="/insights">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Insights
          </Link>
        </Button>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
            <p className="text-sm text-muted-foreground">
              Generate and export detailed reports for your workspace.
            </p>
          </div>
          <Button>
            <Download className="mr-1 h-4 w-4" /> Export All
          </Button>
        </div>
      </div>

      {/* Reports grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {reports.map(({ id, title, description, icon: Icon, lastGenerated, frequency }) => (
          <Card key={id} className="flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{title}</CardTitle>
                  </div>
                </div>
                <Badge variant="outline">{frequency}</Badge>
              </div>
              <CardDescription className="mt-2">{description}</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Last generated: {lastGenerated}</p>
                <Button size="sm" variant="outline">
                  <Download className="mr-1 h-3.5 w-3.5" /> Generate
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Scheduled reports notice */}
      <Card className="bg-muted/50">
        <CardContent className="flex items-center justify-between p-4">
          <div>
            <p className="font-medium">Scheduled Reports</p>
            <p className="text-sm text-muted-foreground">
              Set up automatic report delivery to your email on a schedule.
            </p>
          </div>
          <Button variant="outline" size="sm">
            Configure
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
