"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2, Monitor, Moon, Sun, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { saveWorkspaceName, saveWorkspaceSettings } from "../actions";
import type { WorkspaceSettings, WorkspaceWithSettings } from "@/lib/workspace";

interface WorkspaceFormProps {
  workspace: WorkspaceWithSettings;
}

/* ── helpers ──────────────────────────────────────────────────────────────── */

const THEMES: { value: WorkspaceSettings["theme"]; label: string; icon: React.ReactNode }[] = [
  { value: "light",  label: "Light",  icon: <Sun   className="h-4 w-4" /> },
  { value: "dark",   label: "Dark",   icon: <Moon  className="h-4 w-4" /> },
  { value: "system", label: "System", icon: <Monitor className="h-4 w-4" /> },
];

function applyTheme(theme: WorkspaceSettings["theme"]) {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else if (theme === "light") {
    root.classList.remove("dark");
  } else {
    // system
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }
}

/* ── component ────────────────────────────────────────────────────────────── */

export function WorkspaceForm({ workspace }: WorkspaceFormProps) {
  /* name */
  const [name, setName]           = useState(workspace.name);
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameSaved, setNameSaved] = useState(false);
  const [isSavingName, startSavingName] = useTransition();

  /* prefs */
  const [theme, setTheme]                   = useState<WorkspaceSettings["theme"]>(workspace.theme);
  const [emailDigest, setEmailDigest]       = useState<WorkspaceSettings["email_digest"]>(workspace.email_digest);
  const [deadlineReminders, setDeadlineReminders] = useState(workspace.deadline_reminders);
  const [defaultPriority, setDefaultPriority]     = useState<WorkspaceSettings["default_priority"]>(workspace.default_priority);
  const [defaultDeadline, setDefaultDeadline]     = useState<WorkspaceSettings["default_deadline"]>(workspace.default_deadline);
  const [prefError, setPrefError]   = useState<string | null>(null);
  const [prefSaved, setPrefSaved]   = useState(false);
  const [isSavingPrefs, startSavingPrefs] = useTransition();

  /* delete confirm */
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  /* apply theme immediately on mount (cookie sets server-class, this handles client nav) */
  useEffect(() => { applyTheme(workspace.theme); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── handlers ─────────────────────────────────────────────────────────── */

  function handleSaveName() {
    setNameError(null);
    setNameSaved(false);
    startSavingName(async () => {
      const res = await saveWorkspaceName(name);
      if (res.error) { setNameError(res.error); return; }
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 2500);
    });
  }

  function handleThemeChange(t: WorkspaceSettings["theme"]) {
    setTheme(t);
    applyTheme(t); // instant preview
  }

  function handleSavePrefs() {
    setPrefError(null);
    setPrefSaved(false);
    startSavingPrefs(async () => {
      const res = await saveWorkspaceSettings({
        theme,
        email_digest: emailDigest,
        deadline_reminders: deadlineReminders,
        default_priority: defaultPriority,
        default_deadline: defaultDeadline,
      });
      if (res.error) { setPrefError(res.error); return; }
      setPrefSaved(true);
      setTimeout(() => setPrefSaved(false), 2500);
    });
  }

  /* ── render ───────────────────────────────────────────────────────────── */

  return (
    <div className="max-w-2xl space-y-6">

      {/* ── Workspace name ───────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>Basic workspace information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Workspace name</label>
            <input
              type="text"
              value={name}
              maxLength={80}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Workspace URL</label>
            <div className="flex items-center rounded-md border border-input bg-muted/50">
              <span className="border-r border-input px-3 py-2 text-sm text-muted-foreground">
                planify.io/
              </span>
              <span className="px-3 py-2 text-sm text-muted-foreground">
                {name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || "…"}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Auto-generated from workspace name.</p>
          </div>
          {nameError && <p className="text-sm text-destructive">{nameError}</p>}
          <div className="flex items-center justify-end gap-3">
            {nameSaved && <span className="text-sm text-green-600">Saved!</span>}
            <Button onClick={handleSaveName} disabled={isSavingName}>
              {isSavingName && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Save
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Appearance ───────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Choose how Planify looks for you.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {THEMES.map(({ value, label, icon }) => (
              <button
                key={value}
                onClick={() => handleThemeChange(value)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-lg border-2 p-4 text-sm font-medium transition-colors",
                  theme === value
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                )}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Notifications ────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Configure how and when you receive notifications.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Email digest */}
          <div>
            <p className="mb-2 text-sm font-medium">Email digest</p>
            <div className="flex gap-2">
              {(["daily", "weekly", "off"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setEmailDigest(v)}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-sm capitalize transition-colors",
                    emailDigest === v
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Receive a summary of completed and overdue tasks.
            </p>
          </div>

          <Separator />

          {/* Deadline reminders */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Deadline reminders</p>
              <p className="text-xs text-muted-foreground">
                Get an alert 24 hours before a task is due.
              </p>
            </div>
            <button
              role="switch"
              aria-checked={deadlineReminders}
              onClick={() => setDeadlineReminders((v) => !v)}
              className={cn(
                "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                deadlineReminders ? "bg-primary" : "bg-muted"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform",
                  deadlineReminders ? "translate-x-4" : "translate-x-0"
                )}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* ── Task Defaults ────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Task Defaults</CardTitle>
          <CardDescription>Pre-fill values when creating new tasks.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Default priority */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">Default priority</label>
            <select
              value={defaultPriority}
              onChange={(e) => setDefaultPriority(e.target.value as WorkspaceSettings["default_priority"])}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          {/* Default deadline */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">Default deadline</label>
            <select
              value={defaultDeadline}
              onChange={(e) => setDefaultDeadline(e.target.value as WorkspaceSettings["default_deadline"])}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="none">No default</option>
              <option value="today">Today</option>
              <option value="tomorrow">Tomorrow</option>
              <option value="week">End of this week</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Save prefs */}
      {prefError && <p className="text-sm text-destructive">{prefError}</p>}
      <div className="flex items-center justify-end gap-3">
        {prefSaved && <span className="text-sm text-green-600">Saved!</span>}
        <Button onClick={handleSavePrefs} disabled={isSavingPrefs}>
          {isSavingPrefs && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
          Save Preferences
        </Button>
      </div>

      {/* ── Danger Zone ──────────────────────────────────────────────────── */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Irreversible workspace actions.</CardDescription>
        </CardHeader>
        <CardContent>
          <Separator className="mb-4" />
          {!showDeleteConfirm ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Delete workspace</p>
                <p className="text-sm text-muted-foreground">
                  Permanently deletes this workspace and all its data. This cannot be undone.
                </p>
              </div>
              <Button variant="destructive" size="sm" onClick={() => setShowDeleteConfirm(true)}>
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Delete Workspace
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 space-y-3">
              <p className="text-sm font-medium text-destructive">
                This will permanently delete <strong>{workspace.name}</strong> and all its projects, tasks, and members.
              </p>
              <div className="flex gap-2">
                <Button variant="destructive" size="sm" disabled>
                  Yes, delete workspace
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Workspace deletion is not yet available in this version.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
