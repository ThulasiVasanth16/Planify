import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FolderKanban, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { Project } from "@/lib/projects";

export function ProjectProgress({ projects }: { projects: Project[] }) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Project Progress</CardTitle>
          <CardDescription>Completion percentage per active project.</CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/projects">
            View all <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="flex-1">
        {projects.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center gap-1 text-center">
            <FolderKanban className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm font-medium">No projects yet</p>
            <p className="text-xs text-muted-foreground">
              <Link href="/projects" className="underline underline-offset-2">
                Create your first project
              </Link>{" "}
              to track progress here.
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {projects.map((project) => (
              <li key={project.id}>
                <Link href={`/projects/${project.id}`} className="group block">
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium group-hover:underline group-hover:underline-offset-2">
                      {project.name}
                    </span>
                    <span className="text-muted-foreground">
                      {project.completed_tasks}/{project.total_tasks} tasks &middot; {project.completion_pct}%
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${project.completion_pct}%`,
                        backgroundColor: project.color ?? "#6366f1",
                      }}
                    />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
