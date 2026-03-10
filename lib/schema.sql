-- Run this once against your Neon database to create the required tables.
-- You can run it via the Neon SQL Editor or psql.
-- Re-running is safe — all statements use CREATE TABLE IF NOT EXISTS.

-- ── Core identity ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS workspaces (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT        NOT NULL UNIQUE,   -- Clerk user ID
  name        TEXT        NOT NULL,
  slug        TEXT        NOT NULL,
  goal        TEXT,                          -- 'student' | 'professional' | 'freelancer' | 'team'
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_profiles (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT        NOT NULL UNIQUE,  -- Clerk user ID
  display_name  TEXT        NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Projects ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS projects (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT        NOT NULL,           -- Clerk user ID (owner)
  name        TEXT        NOT NULL,
  description TEXT,
  status      TEXT        NOT NULL DEFAULT 'active',  -- 'active' | 'completed' | 'archived'
  color       TEXT        NOT NULL DEFAULT '#6366f1',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS projects_user_id_idx ON projects (user_id);

-- ── Tasks ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tasks (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT        NOT NULL,           -- Clerk user ID (creator/owner)
  project_id  UUID        REFERENCES projects(id) ON DELETE SET NULL,
  title       TEXT        NOT NULL,
  description TEXT,
  status      TEXT        NOT NULL DEFAULT 'todo',    -- 'todo' | 'in_progress' | 'in_review' | 'done'
  priority    TEXT        NOT NULL DEFAULT 'medium',  -- 'low' | 'medium' | 'high'
  due_date    DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tasks_user_id_idx    ON tasks (user_id);
CREATE INDEX IF NOT EXISTS tasks_project_id_idx ON tasks (project_id);
CREATE INDEX IF NOT EXISTS tasks_status_idx     ON tasks (status);
CREATE INDEX IF NOT EXISTS tasks_priority_idx   ON tasks (priority);

-- Add notes and assignee columns if not already present (safe to re-run)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS notes       TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assignee_id TEXT;  -- Clerk user ID of the assigned member

-- ── Team ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS team_members (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id      TEXT,                              -- Clerk user ID (NULL while invite is pending)
  display_name TEXT        NOT NULL,
  email        TEXT        NOT NULL,
  role         TEXT        NOT NULL DEFAULT 'member',   -- 'admin' | 'member'
  status       TEXT        NOT NULL DEFAULT 'pending',  -- 'active' | 'pending'
  invited_by   TEXT        NOT NULL,             -- Clerk user ID of the inviter
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, email)
);

CREATE INDEX IF NOT EXISTS team_members_workspace_id_idx ON team_members (workspace_id);

-- ── Workspace settings columns (safe to re-run) ────────────────────────────
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS theme                    TEXT    NOT NULL DEFAULT 'system';  -- 'light' | 'dark' | 'system'
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS email_digest            TEXT    NOT NULL DEFAULT 'weekly';  -- 'daily' | 'weekly' | 'off'
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS deadline_reminders      BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS default_priority        TEXT    NOT NULL DEFAULT 'medium';  -- 'low' | 'medium' | 'high'
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS default_deadline        TEXT    NOT NULL DEFAULT 'none';    -- 'none' | 'today' | 'tomorrow' | 'week'
