# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start development server on localhost:3000
npm run build      # Production build (also runs type-check)
npm run lint       # ESLint
```

Type-check without building:
```bash
node node_modules/typescript/bin/tsc --noEmit
```

> `npx tsc` is broken in this environment — use the `node` invocation above.

## Architecture

### Layout hierarchy

Two distinct layout trees:

1. **Public / auth pages** — `app/layout.tsx` → page
   Routes: `/`, `/sign-in`, `/sign-up`, `/onboarding`, `/onboarding/workspace`
   No sidebar. `ClerkProvider` wraps the entire app at this root level.

2. **Authenticated app** — `app/layout.tsx` → `app/(app)/layout.tsx` → page
   The `(app)` route group adds `components/layout/sidebar.tsx`.
   All post-auth screens live here: dashboard, projects, tasks, team, insights, settings.

### Authentication & access control

- **`proxy.ts`** (Next.js 16's replacement for `middleware.ts`) runs `clerkMiddleware`.
  Public routes: `/`, `/sign-in(.*)`, `/sign-up(.*)`. Everything else calls `auth.protect()`.
- `<SignIn />` and `<SignUp />` use **`routing="hash"`** — spec requires flat `page.tsx` files, not catch-all directories. Hash routing keeps multi-step Clerk flows on the same URL.
- Clerk v7 redirect env vars: `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_FALLBACK_REDIRECT_URL` and `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_FALLBACK_REDIRECT_URL`. The old v4 names (`NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` etc.) are silently ignored by v7 and cause redirect-to-root bugs.
- **Onboarding gate**: `app/onboarding/page.tsx` calls `getWorkspaceByUserId()` and redirects to `/dashboard` if workspace already exists.

### Database

- Driver: `@neondatabase/serverless` — the `sql` tagged-template client is exported from `lib/db.ts`.
- `lib/db.ts` strips `channel_binding` from the DATABASE_URL before passing to `neon()` — this is required because `channel_binding=require` is a PostgreSQL wire-protocol parameter incompatible with Neon's HTTP transport.
- Query helpers live in `lib/` files named by domain. Keep raw SQL out of route files and server actions.
  - `lib/workspace.ts` — workspace CRUD
  - `lib/projects.ts` — project CRUD + completion stats
  - `lib/tasks.ts` — task CRUD + filtering
  - `lib/team.ts` — team members, invite, role updates, team task views
  - `lib/analytics.ts` — analytics summary (streak, weekly buckets, heatmap, project breakdown)
- Schema source of truth: `lib/schema.sql` — run this once in the Neon SQL editor. No migration runner; DDL is applied manually.
- Current tables: `workspaces`, `user_profiles`, `projects`, `tasks`, `team_members`.
  - `tasks` columns: `id`, `user_id`, `project_id`, `title`, `description`, `status`, `priority`, `due_date`, `notes`, `assignee_id`, `created_at`
  - `team_members` columns: `id`, `workspace_id`, `user_id` (NULL while pending), `display_name`, `email`, `role`, `status`, `invited_by`, `created_at`
  - Task statuses: `todo` | `in_progress` | `in_review` | `done`
  - Task priorities: `low` | `medium` | `high`

### API routes

REST handlers live in `app/api/` and follow ownership validation: every query filters by the authenticated `userId` from Clerk so users can only access their own data.

**Tasks**
- `GET /api/tasks` — list with filter params (`status`, `priority`, `projectId`, `search`, `sort`)
- `POST /api/tasks` — create task
- `PATCH /api/tasks/[id]` — full update (when `title` present) or status-only toggle (for Kanban optimistic UI)
- `DELETE /api/tasks/[id]` — delete task, returns 204

**Projects**
- `GET /api/projects` — list projects with completion stats
- `GET /api/projects/[id]` — single project detail with tasks
- `DELETE /api/projects/[id]` — delete project

**Team**
- `GET /api/team` — list team members for user's workspace
- `POST /api/team/invite` — invite a new member (insert or update on email conflict)
- `DELETE /api/team/[id]` — remove a member
- `PATCH /api/team/[id]` — update member role
- `POST /api/team/[id]/resend` — resend invite
- `GET /api/team/tasks` — workspace task list with assignee names

**Analytics**
- `GET /api/analytics/summary` — returns all analytics in one call: streak, completion rate, weekly buckets (8 weeks), project breakdown, heatmap (current month)

### Server actions

Server actions live in `actions.ts` files co-located with the route that owns them (e.g. `app/onboarding/actions.ts`). They always:
1. Call `auth()` from `@clerk/nextjs/server` and redirect to `/sign-in` if no session.
2. Delegate DB writes to a `lib/` helper, never touching `sql` directly.
3. End with `redirect()` — callers do not handle navigation themselves.

### Component co-location pattern

Interactive client components for a route are placed in a `_components/` subfolder next to the route's `page.tsx`. The `_` prefix prevents Next.js from treating them as routes. The `page.tsx` is always a server component that handles auth/data-fetching.

### Optimistic UI pattern

Client components that need instant feedback use `useOptimistic` + `useTransition` (React 19). The pattern: dispatch an optimistic action → fire the API call in a transition → on failure the optimistic state rolls back automatically. See `app/(app)/tasks/_components/task-board.tsx` for the canonical example.

### URL as filter state

Filter and sort state lives in URL search params, not React state. The server page reads `searchParams`, fetches filtered data server-side, and passes it to the client component. Filter changes call `router.push()` with updated params, triggering a server re-fetch. See `/tasks` page + `task-filters.tsx`.

### Styling

- **Tailwind CSS v4** — no `tailwind.config.js`. All configuration is in `app/globals.css` via `@import "tailwindcss"` and `@theme inline {}`.
- Design tokens (colors, radius) are CSS custom properties in `:root` / `.dark`, mapped to Tailwind utilities inside `@theme inline`.
- **shadcn/ui** was initialised manually (the CLI requires interactive input). Primitives live in `components/ui/`. Use `cn()` from `lib/utils.ts` for conditional class merging.

### Screen inventory

Do not add or rename routes. Screens beyond the 15 below are out of scope:

| Route | File | Status |
|---|---|---|
| `/` | `app/page.tsx` | ✓ done |
| `/sign-in` | `app/sign-in/page.tsx` | ✓ done |
| `/sign-up` | `app/sign-up/page.tsx` | ✓ done |
| `/onboarding` | `app/onboarding/page.tsx` | ✓ done |
| `/onboarding/workspace` | `app/onboarding/workspace/page.tsx` | ✓ done |
| `/dashboard` | `app/(app)/dashboard/page.tsx` | ✓ done |
| `/tasks` | `app/(app)/tasks/page.tsx` | ✓ done |
| `/tasks/[id]` | `app/(app)/tasks/[id]/page.tsx` | ✓ done |
| `/projects` | `app/(app)/projects/page.tsx` | placeholder |
| `/projects/[id]` | `app/(app)/projects/[id]/page.tsx` | placeholder |
| `/team` | `app/(app)/team/page.tsx` | placeholder |
| `/team/invite` | `app/(app)/team/invite/page.tsx` | placeholder |
| `/insights` | `app/(app)/insights/page.tsx` | ✓ done |
| `/insights/reports` | `app/(app)/insights/reports/page.tsx` | ✓ done |
| `/settings/profile` | `app/(app)/settings/profile/page.tsx` | ✓ done |
| `/settings/workspace` | `app/(app)/settings/workspace/page.tsx` | ✓ done |

### Environment variables

All keys are in `.env.local`. Required: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `DATABASE_URL` (Neon connection string).
