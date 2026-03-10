"use client";

import { useState, useEffect, useRef } from "react";
import { X, Send, RefreshCw, Trash2, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { TeamMember } from "@/lib/team";

interface InviteMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: TeamMember[];
  ownerProfile: { user_id: string; display_name: string } | null;
  onInvite: (member: TeamMember) => void;
  onCancel: (memberId: string) => void;
}

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function InviteMembersModal({
  isOpen,
  onClose,
  members,
  ownerProfile,
  onInvite,
  onCancel,
}: InviteMembersModalProps) {
  const emailRef = useRef<HTMLInputElement>(null);
  const [email, setEmail]     = useState("");
  const [role, setRole]       = useState<"member" | "admin">("member");
  const [error, setError]     = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resentIds, setResentIds] = useState<Set<string>>(new Set());
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  const pending = members.filter((m) => m.status === "pending");
  const active  = members.filter((m) => m.status === "active");

  useEffect(() => {
    if (isOpen) {
      setEmail(""); setRole("member"); setError(null);
      setTimeout(() => emailRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) { setError("Email is required."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) { setError("Enter a valid email address."); return; }
    if (members.some((m) => m.email.toLowerCase() === trimmed)) {
      setError("This person has already been invited."); return;
    }
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, role }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error ?? "Failed to send invitation.");
        return;
      }
      const member: TeamMember = await res.json();
      onInvite(member);
      setEmail("");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend(memberId: string) {
    setResendingId(memberId);
    try {
      await fetch(`/api/team/${memberId}/resend`, { method: "POST" });
      setResentIds((prev) => new Set(prev).add(memberId));
      setTimeout(() => {
        setResentIds((prev) => { const s = new Set(prev); s.delete(memberId); return s; });
      }, 3000);
    } finally {
      setResendingId(null);
    }
  }

  async function handleCancel(memberId: string) {
    setCancelingId(memberId);
    try {
      await fetch(`/api/team/${memberId}`, { method: "DELETE" });
      onCancel(memberId);
    } finally {
      setCancelingId(null);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="flex w-full max-w-lg flex-col rounded-2xl border border-border bg-card shadow-2xl max-h-[90vh]">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-base font-semibold">Invite Members</h2>
            <p className="text-xs text-muted-foreground">Add people to your workspace</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-5 overflow-y-auto px-6 py-5">
          {/* Invite form */}
          <form onSubmit={handleInvite}>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Email address
            </label>
            <div className="flex gap-2">
              <input
                ref={emailRef}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@company.com"
                className={cn(
                  "flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring",
                  error && "border-destructive focus:ring-destructive"
                )}
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as "member" | "admin")}
                className="rounded-md border border-input bg-background px-2.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
              <Button type="submit" size="sm" disabled={loading} className="shrink-0">
                <Send className="mr-1.5 h-3.5 w-3.5" />
                {loading ? "Sending…" : "Send"}
              </Button>
            </div>
            {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}

            {/* Role hint */}
            <div className="mt-3 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Member</span> — create and manage their own tasks. &nbsp;
              <span className="font-medium text-foreground">Admin</span> — full workspace access including member management.
            </div>
          </form>

          {/* Pending invitations */}
          {pending.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Pending Invitations · {pending.length}
              </h3>
              <div className="space-y-2">
                {pending.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{m.email}</p>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">{m.role}</Badge>
                        <span className="text-[10px] text-muted-foreground">Sent {timeAgo(m.created_at)}</span>
                        {resentIds.has(m.id) && (
                          <span className="flex items-center gap-0.5 text-[10px] text-green-600">
                            <CheckCircle2 className="h-2.5 w-2.5" /> Resent
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        onClick={() => handleResend(m.id)}
                        disabled={resendingId === m.id}
                        className="flex items-center gap-1 rounded px-1.5 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
                        title="Resend invitation"
                      >
                        <RefreshCw className={cn("h-3 w-3", resendingId === m.id && "animate-spin")} />
                        Resend
                      </button>
                      <button
                        onClick={() => handleCancel(m.id)}
                        disabled={cancelingId === m.id}
                        className="flex items-center gap-1 rounded px-1.5 py-1 text-xs text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                        title="Cancel invitation"
                      >
                        <Trash2 className="h-3 w-3" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Current members */}
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Current Members · {active.length + (ownerProfile ? 1 : 0)}
            </h3>
            <div className="space-y-1.5">
              {/* Workspace owner */}
              {ownerProfile && (
                <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarFallback className="text-xs">{initials(ownerProfile.display_name)}</AvatarFallback>
                  </Avatar>
                  <span className="flex-1 truncate text-sm">{ownerProfile.display_name}</span>
                  <Badge variant="default" className="h-4 px-1.5 text-[10px]">admin</Badge>
                  <Badge variant="outline" className="h-4 px-1.5 text-[10px]">you</Badge>
                </div>
              )}
              {active.map((m) => (
                <div key={m.id} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarFallback className="text-xs">{initials(m.display_name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-sm">{m.display_name}</span>
                    <span className="text-[10px] text-muted-foreground">{m.email}</span>
                  </div>
                  <Badge
                    variant={m.role === "admin" ? "default" : "secondary"}
                    className="h-4 shrink-0 px-1.5 text-[10px]"
                  >
                    {m.role}
                  </Badge>
                </div>
              ))}
              {active.length === 0 && !ownerProfile && (
                <p className="text-xs text-muted-foreground">No active members yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-border px-6 py-3">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
