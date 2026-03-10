import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Strip parameters unsupported by the Neon HTTP driver.
// channel_binding is a PostgreSQL wire-protocol flag — the HTTP driver
// communicates over HTTPS and rejects it, causing "fetch failed".
const url = new URL(process.env.DATABASE_URL);
url.searchParams.delete("channel_binding");

export const sql = neon(url.toString());
