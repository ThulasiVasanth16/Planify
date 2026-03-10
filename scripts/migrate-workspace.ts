import { sql } from "../lib/db";

async function migrate() {
  console.log("Adding workspace settings columns...");

  try {
    await sql`ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS theme TEXT NOT NULL DEFAULT 'system'`;
    console.log("✓ theme");
  } catch (e: any) {
    if (!e.message.includes("already exists"))
      console.log("✗ theme:", e.message);
  }

  try {
    await sql`ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS email_digest TEXT NOT NULL DEFAULT 'weekly'`;
    console.log("✓ email_digest");
  } catch (e: any) {
    if (!e.message.includes("already exists"))
      console.log("✗ email_digest:", e.message);
  }

  try {
    await sql`ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS deadline_reminders BOOLEAN NOT NULL DEFAULT true`;
    console.log("✓ deadline_reminders");
  } catch (e: any) {
    if (!e.message.includes("already exists"))
      console.log("✗ deadline_reminders:", e.message);
  }

  try {
    await sql`ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS default_priority TEXT NOT NULL DEFAULT 'medium'`;
    console.log("✓ default_priority");
  } catch (e: any) {
    if (!e.message.includes("already exists"))
      console.log("✗ default_priority:", e.message);
  }

  try {
    await sql`ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS default_deadline TEXT NOT NULL DEFAULT 'none'`;
    console.log("✓ default_deadline");
  } catch (e: any) {
    if (!e.message.includes("already exists"))
      console.log("✗ default_deadline:", e.message);
  }

  console.log("Done!");
}

migrate();
