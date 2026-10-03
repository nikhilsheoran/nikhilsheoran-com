import { Pool } from "pg";

/**
 * The site's Postgres (Supabase), reached through its transaction pooler.
 * Server only. One small pool is shared across hot reloads and warm
 * serverless invocations.
 */
const globalForDb = globalThis as { __sitePool?: Pool };

export const db =
  globalForDb.__sitePool ??
  new Pool({ connectionString: process.env.DATABASE_URL, max: 3 });

globalForDb.__sitePool = db;
