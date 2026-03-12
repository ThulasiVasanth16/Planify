"use client";

import {
  useState,
  useOptimistic,
  useTransition,
  useRef,
  useEffect,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FolderKanban,
  MoreHorizontal,
  Archive,
  Trash2,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateProjectModal } from "@/components/modals/create-project-modal";
import { cn } from "@/lib/utils";
import type { Project } from "@/lib/projects";
import { useCreateTask } from "@/components/providers/create-task-provider";

type OptimisticAction =
  | { type: "add"; project: Project }
  | { type: "remove"; id: string }
  | {
      type: "updateTaskCount";
      projectId: string;
      total: number;
      completed: number;
      pct: number;
    };

function applyAction(projects: Project[], action: OptimisticAction): Project[] {
  if (action.type === "add") return [action.project, ...projects];
  if (action.type === "remove")
    return projects.filter((p) => p.id !== action.id);
  if (action.type === "updateTaskCount") {
    return projects.map((p) =>
      p.id === action.projectId
        ? {
            ...p,
            total_tasks: action.total,
            completed_tasks: action.completed,
            completion_pct: action.pct,
          }
        : p,
    );
  }
  return projects;
}

interface ProjectGridProps {
  initialProjects: Project[];
}

export function ProjectGrid({ initialProjects }: ProjectGridProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [projects, dispatch] = useOptimistic<Project[], OptimisticAction>(
    initialProjects,
    applyAction,
  );
  const [modalOpen, setModalOpen] = useState(false);
  const { registerOnSuccess } = useCreateTask();

  // Use ref to track projects for the callback
  const projectsRef = useRef(projects);
  projectsRef.current = projects;

  // Subscribe to task creation events to update project counts
  useEffect(() => {
    const unsubscribe = registerOnSuccess((task) => {
      if (!task.project_id) return;

      // Store project_id after null check for TypeScript
      const projectId = task.project_id;

      // Use ref to get latest projects
      const currentProjects = projectsRef.current;
      const project = currentProjects.find((p) => p.id === projectId);
      if (!project) return;

      // Calculate new task counts
      const newTotal = project.total_tasks + 1;
      const newCompleted =
        project.completed_tasks + (task.status === "done" ? 1 : 0);
      const newPct =
        newTotal > 0 ? Math.round((newCompleted / newTotal) * 100) : 0;

      // Update optimistic state
      startTransition(() => {
        dispatch({
          type: "updateTaskCount",
          projectId,
          total: newTotal,
          completed: newCompleted,
          pct: newPct,
        });
      });

      // Trigger router refresh after a short delay
      setTimeout(() => {
        router.refresh();
      }, 20);
    });

    return unsubscribe;
  }, [registerOnSuccess, dispatch, router]);

  function handleCreate(project: Project) {
    startTransition(() => {
      dispatch({ type: "add", project });
    });
    router.refresh();
  }

  function handleRemove(id: string) {
    startTransition(() => {
      dispatch({ type: "remove", id });
    });
  }

  return (
    <>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Projects</h1>
          <p className='text-sm text-muted-foreground'>
            {projects.length} project{projects.length !== 1 ? "s" : ""} in your
            workspace.
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>New Project</Button>
      </div>

      {/* Grid */}
      {projects.length === 0 ? (
        <div className='flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 md:py-24 text-center px-4'>
          <FolderKanban className='mb-3 h-8 w-8 md:h-10 md:w-10 text-muted-foreground/50' />
          <p className='font-medium'>No projects yet</p>
          <p className='mt-1 text-sm text-muted-foreground'>
            Projects will appear here once created.
          </p>
          <Button onClick={() => setModalOpen(true)} className='mt-4' size='sm'>
            <Plus className='mr-1 h-4 w-4' />
            New Project
          </Button>
        </div>
      ) : (
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}

      <CreateProjectModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreate}
      />
    </>
  );
}

function ProjectCard({
  project,
  onRemove,
}: {
  project: Project;
  onRemove: (id: string) => void;
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setConfirmDelete(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  async function handleArchive() {
    setMenuOpen(false);
    await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "archive" }),
    });
    onRemove(project.id);
    router.refresh();
  }

  async function handleDelete() {
    setMenuOpen(false);
    setConfirmDelete(false);
    await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
    onRemove(project.id);
    router.refresh();
  }

  return (
    <div className='group relative flex flex-col rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md'>
      {/* Color bar */}
      <div
        className='h-1.5 w-full rounded-t-xl'
        style={{ backgroundColor: project.color }}
      />

      {/* Card body */}
      <div className='flex flex-1 flex-col p-4'>
        <div className='flex items-start justify-between gap-2'>
          <Link
            href={`/projects/${project.id}`}
            className='min-w-0 flex-1 hover:underline underline-offset-2'
          >
            <h3 className='truncate font-semibold'>{project.name}</h3>
          </Link>

          {/* Options menu */}
          <div ref={menuRef} className='relative shrink-0'>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((v) => !v);
              }}
              className='rounded-md p-1 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-muted hover:text-foreground transition-all'
              aria-label='Project options'
            >
              <MoreHorizontal className='h-4 w-4' />
            </button>

            {menuOpen && (
              <div className='absolute right-0 top-7 z-20 min-w-[160px] rounded-lg border border-border bg-card shadow-lg'>
                {!confirmDelete ? (
                  <>
                    <button
                      onClick={handleArchive}
                      className='flex w-full items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors'
                    >
                      <Archive className='h-3.5 w-3.5' /> Archive
                    </button>
                    <button
                      onClick={() => setConfirmDelete(true)}
                      className='flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors'
                    >
                      <Trash2 className='h-3.5 w-3.5' /> Delete
                    </button>
                  </>
                ) : (
                  <div className='px-3 py-2'>
                    <p className='mb-2 text-xs font-medium text-destructive'>
                      Delete permanently?
                    </p>
                    <div className='flex gap-1.5'>
                      <button
                        onClick={handleDelete}
                        className='flex-1 rounded bg-destructive px-2 py-1 text-xs font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors'
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setConfirmDelete(false)}
                        className='flex-1 rounded bg-muted px-2 py-1 text-xs font-medium hover:bg-muted/80 transition-colors'
                      >
                        No
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {project.description && (
          <p className='mt-1 line-clamp-2 text-xs text-muted-foreground'>
            {project.description}
          </p>
        )}

        {/* Stats */}
        <div className='mt-auto pt-4'>
          <div className='mb-1.5 flex items-center justify-between text-xs text-muted-foreground'>
            <span>
              {project.completed_tasks}/{project.total_tasks} tasks
            </span>
            <span className='font-medium' style={{ color: project.color }}>
              {project.completion_pct}%
            </span>
          </div>
          <div className='h-1.5 w-full overflow-hidden rounded-full bg-muted'>
            <div
              className='h-full rounded-full transition-all duration-500'
              style={{
                width: `${project.completion_pct}%`,
                backgroundColor: project.color,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
