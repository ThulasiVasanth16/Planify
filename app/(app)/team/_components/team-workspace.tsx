"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  UserPlus,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  MoreHorizontal,
  Trash2,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { InviteMembersModal } from "@/components/modals/InviteMembersModal";
import { cn } from "@/lib/utils";
import type { TeamMember, TeamTask, TeamStats } from "@/lib/team";
import { useState, useTransition } from "react";

interface TeamWorkspaceProps {
  workspace: { id: string; name: string };
  ownerProfile: { user_id: string; display_name: string } | null;
  members: TeamMember[];
  initialTasks: TeamTask[];
  stats: TeamStats;
  isAdmin: boolean;
  activeAssignee: string | null;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function TeamWorkspace({
  workspace,
  ownerProfile,
  members,
  initialTasks,
  stats,
  isAdmin,
  activeAssignee,
}: TeamWorkspaceProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [localMembers, setLocalMembers] = useState<TeamMember[]>(members);
  const [inviteOpen, setInviteOpen] = useState(false);

  function setAssigneeFilter(userId: string | null) {
    const url = userId ? `/team?assignee=${userId}` : "/team";
    router.push(url);
  }

  async function handleRemoveMember(memberId: string) {
    await fetch(`/api/team/${memberId}`, { method: "DELETE" });
    setLocalMembers((prev) => prev.filter((m) => m.id !== memberId));
    startTransition(() => router.refresh());
  }

  async function handleRoleChange(
    memberId: string,
    newRole: "admin" | "member",
  ) {
    await fetch(`/api/team/${memberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    setLocalMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)),
    );
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className='flex h-full gap-4 lg:gap-6 overflow-hidden flex-col lg:flex-row'>
      {/* ── Left: Member list (hidden on mobile, shown in drawer or above) ── */}
      <aside className='flex w-full lg:w-64 shrink-0 flex-col gap-4 overflow-y-auto lg:overflow-hidden'>
        <div className='flex flex-col gap-[inherit] rounded-xl border border-border bg-card p-4'>
          <div className='flex items-center justify-between'>
            <h2 className='font-semibold'>Members</h2>
            <Button size='sm' onClick={() => setInviteOpen(true)}>
              <UserPlus className='mr-1 h-3.5 w-3.5' /> Invite
            </Button>
          </div>

          {/* Owner (always shown as admin) */}
          {ownerProfile && (
            <MemberRow
              name={ownerProfile.display_name}
              email=''
              role='admin'
              status='active'
              isOwner={true}
              isAdmin={isAdmin}
              isActive={activeAssignee === ownerProfile.user_id}
              onClick={() =>
                setAssigneeFilter(
                  activeAssignee === ownerProfile.user_id
                    ? null
                    : ownerProfile.user_id,
                )
              }
            />
          )}

          {localMembers.map((m) => (
            <MemberRow
              key={m.id}
              name={m.display_name}
              email={m.email}
              role={m.role}
              status={m.status}
              isOwner={false}
              isAdmin={isAdmin}
              isActive={activeAssignee === m.user_id}
              onClick={() =>
                setAssigneeFilter(
                  m.user_id && activeAssignee === m.user_id
                    ? null
                    : (m.user_id ?? null),
                )
              }
              onRemove={() => handleRemoveMember(m.id)}
              onRoleChange={(role) => handleRoleChange(m.id, role)}
            />
          ))}

          {localMembers.length === 0 && !ownerProfile && (
            <div className='rounded-lg border border-dashed border-border p-4 text-center'>
              <Users className='mx-auto mb-2 h-6 w-6 text-muted-foreground/50' />
              <p className='text-xs text-muted-foreground'>No members yet</p>
            </div>
          )}

          {/* Show all / clear filter */}
          {activeAssignee && (
            <button
              onClick={() => setAssigneeFilter(null)}
              className='text-xs text-primary hover:underline underline-offset-2'
            >
              Show all tasks
            </button>
          )}
        </div>
      </aside>

      {/* ── Right: Stats + Task table ── */}
      <div className='flex flex-1 flex-col gap-5 overflow-hidden'>
        {/* Stats row */}
        <div className='grid grid-cols-3 gap-4'>
          <StatCard label='Total Tasks' value={stats.total} accent='blue' />
          <StatCard
            label='In Progress'
            value={stats.in_progress}
            accent='yellow'
          />
          <StatCard label='Completed' value={stats.completed} accent='green' />
        </div>

        {/* Task table */}
        <div className='flex-1 overflow-auto rounded-xl border border-border bg-card'>
          <table className='w-full'>
            <thead className='border-b border-border bg-muted/50 text-xs uppercase text-muted-foreground'>
              <tr>
                <th className='px-4 py-3 text-left font-medium'>Task</th>
                <th className='px-4 py-3 text-left font-medium'>Status</th>
                <th className='px-4 py-3 text-left font-medium'>Assignee</th>
                <th className='px-4 py-3 text-left font-medium'>Due</th>
              </tr>
            </thead>
            <tbody className='text-sm'>
              {initialTasks.map((task) => {
                const isOverdue =
                  task.due_date &&
                  task.status !== "completed" &&
                  task.due_date < today;
                return (
                  <tr
                    key={task.id}
                    className={cn(
                      "border-b border-border last:border-0 hover:bg-muted/50",
                      isOverdue && "bg-red-50/50 dark:bg-red-950/20",
                    )}
                  >
                    <td className='px-4 py-3'>
                      <div className='flex items-center gap-2'>
                        {task.status === "completed" ? (
                          <CheckCircle2 className='h-4 w-4 text-green-500' />
                        ) : (
                          <div className='h-4 w-4 rounded-full border-2 border-muted-foreground/30' />
                        )}
                        <span
                          className={cn(
                            task.status === "completed" &&
                              "line-through text-muted-foreground",
                          )}
                        >
                          {task.title}
                        </span>
                      </div>
                    </td>
                    <td className='px-4 py-3'>
                      <Badge
                        variant={
                          task.status === "completed"
                            ? "default"
                            : task.status === "in_progress"
                              ? "secondary"
                              : "outline"
                        }
                        className={cn(
                          "capitalize",
                          task.status === "completed" &&
                            "bg-green-500 hover:bg-green-600",
                        )}
                      >
                        {task.status.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className='px-4 py-3'>
                      {task.assignee_name ? (
                        <div className='flex items-center gap-2'>
                          <Avatar className='h-6 w-6'>
                            <AvatarFallback className='text-[10px]'>
                              {initials(task.assignee_name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className='text-xs'>{task.assignee_name}</span>
                        </div>
                      ) : (
                        <span className='text-xs text-muted-foreground'>
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td className='px-4 py-3'>
                      {task.due_date ? (
                        <div
                          className={cn(
                            "flex items-center gap-1 text-xs",
                            isOverdue
                              ? "text-red-500 font-medium"
                              : "text-muted-foreground",
                          )}
                        >
                          {isOverdue ? (
                            <AlertCircle className='h-3 w-3' />
                          ) : (
                            <Clock className='h-3 w-3' />
                          )}
                          {task.due_date}
                        </div>
                      ) : (
                        <span className='text-xs text-muted-foreground'>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {initialTasks.length === 0 && (
            <div className='flex flex-col items-center justify-center py-12 text-muted-foreground'>
              <Users className='mb-2 h-8 w-8' />
              <p className='text-sm'>No tasks yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Invite members modal */}
      <InviteMembersModal
        isOpen={inviteOpen}
        onClose={() => setInviteOpen(false)}
        members={localMembers}
        ownerProfile={ownerProfile}
        onInvite={(member) => setLocalMembers((prev) => [...prev, member])}
        onCancel={(memberId) =>
          setLocalMembers((prev) => prev.filter((m) => m.id !== memberId))
        }
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: "blue" | "yellow" | "green";
}) {
  const accentClass =
    accent === "green"
      ? "text-green-600 dark:text-green-400"
      : accent === "yellow"
        ? "text-yellow-600 dark:text-yellow-400"
        : "text-blue-600 dark:text-blue-400";

  return (
    <div className='flex rounded-xl border justify-between border-border bg-card p-4'>
      <div className='flex items-center justify-between text-muted-foreground'>
        <span className='text-xs uppercase tracking-wide'>{label}</span>
      </div>
      <p className={cn("text-2xl font-bold", accentClass)}>{value}</p>
    </div>
  );
}

function MemberRow({
  name,
  email,
  role,
  status,
  isOwner,
  isAdmin,
  isActive,
  onClick,
  onRemove,
  onRoleChange,
  inviteOpen,
  setInviteOpen,
  localMembers,
  setLocalMembers,
  ownerProfile,
}: {
  name: string;
  email: string;
  role: string;
  status: string;
  isOwner: boolean;
  isAdmin: boolean;
  isActive: boolean;
  onClick: () => void;
  onRemove?: () => void;
  onRoleChange?: (role: "admin" | "member") => void;
  inviteOpen?: boolean;
  setInviteOpen?: (open: boolean) => void;
  localMembers?: TeamMember[];
  setLocalMembers?: (members: TeamMember[]) => void;
  ownerProfile?: { user_id: string; display_name: string } | null;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      onClick={onClick}
      className={cn(
        "group flex cursor-pointer items-center gap-2.5 rounded-lg border border-border px-3 py-2.5 transition-colors hover:bg-muted/50",
        isActive && "border-primary bg-primary/5",
      )}
    >
      <Avatar className='h-7 w-7 shrink-0'>
        <AvatarFallback className='text-xs'>{initials(name)}</AvatarFallback>
      </Avatar>
      <div className='min-w-0 flex-1'>
        <p className='truncate text-sm font-medium'>{name}</p>
        {email && (
          <p className='truncate text-xs text-muted-foreground'>{email}</p>
        )}
      </div>
      <div className='flex items-center gap-1'>
        <Badge
          variant='secondary'
          className={cn(
            "text-[10px] px-1.5 py-0 capitalize",
            role === "admin"
              ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
              : "bg-muted text-muted-foreground",
          )}
        >
          {isOwner ? "owner" : role}
        </Badge>

        {/* Admin actions */}
        {isAdmin && !isOwner && (
          <div className='relative' onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className='rounded p-0.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-muted transition-all'
            >
              <MoreHorizontal className='h-3.5 w-3.5' />
            </button>
            {menuOpen && (
              <div className='absolute right-0 top-6 z-20 min-w-[140px] rounded-lg border border-border bg-card shadow-lg'>
                {onRoleChange && (
                  <button
                    onClick={() => {
                      onRoleChange(role === "admin" ? "member" : "admin");
                      setMenuOpen(false);
                    }}
                    className='flex w-full items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:bg-muted transition-colors'
                  >
                    <ShieldCheck className='h-3 w-3' />
                    Make {role === "admin" ? "member" : "admin"}
                  </button>
                )}
                {onRemove && (
                  <button
                    onClick={() => {
                      onRemove();
                      setMenuOpen(false);
                    }}
                    className='flex w-full items-center gap-2 px-3 py-2 text-xs text-destructive hover:bg-destructive/10 transition-colors'
                  >
                    <Trash2 className='h-3 w-3' /> Remove
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
