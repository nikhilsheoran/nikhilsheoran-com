/**
 * One-time copy of the Convex production data into Supabase.
 *
 *   bun scripts/import-convex-export.ts <folder with user.json, account.json, messages.json>
 *
 * The JSON files come from `bunx convex data <table> --prod --format jsonArray`
 * (user and account from the betterAuth component). Convex ids are kept as the
 * new ids so every message still points at its author. Sessions are not
 * copied: people simply sign in again. Safe to run twice (existing rows are
 * left alone). Reads DATABASE_URL from .env.local.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Pool } from "pg";

const dir = process.argv[2];
if (!dir) throw new Error("pass the export folder");
const load = (name: string) => JSON.parse(readFileSync(join(dir, `${name}.json`), "utf8")) as Record<string, any>[];
const at = (ms: number | null | undefined) => (ms == null ? null : new Date(ms));

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const client = await pool.connect();
  try {
    await client.query("begin");
    for (const u of load("user"))
      await client.query(
        `insert into "user" (id, name, email, "emailVerified", image, "createdAt", "updatedAt")
         values ($1,$2,$3,$4,$5,$6,$7) on conflict (id) do nothing`,
        [u._id, u.name, u.email, Boolean(u.emailVerified), u.image ?? null, at(u.createdAt), at(u.updatedAt)],
      );
    for (const a of load("account"))
      await client.query(
        `insert into account (id, "accountId", "providerId", "userId", "accessToken", "refreshToken", "idToken",
           "accessTokenExpiresAt", "refreshTokenExpiresAt", scope, "createdAt", "updatedAt")
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) on conflict (id) do nothing`,
        [a._id, a.accountId, a.providerId, a.userId, a.accessToken ?? null, a.refreshToken ?? null, a.idToken ?? null,
         at(a.accessTokenExpiresAt), at(a.refreshTokenExpiresAt), a.scope ?? null, at(a.createdAt), at(a.updatedAt)],
      );
    const already = Number((await client.query("select count(*) from guestbook_messages")).rows[0].count);
    if (already === 0)
      for (const m of load("messages"))
        await client.query(
          `insert into guestbook_messages (user_id, name, avatar_url, message, created_at) values ($1,$2,$3,$4,$5)`,
          [m.userId, m.name, m.avatarUrl ?? null, m.message, at(m._creationTime)],
        );
    await client.query("commit");
    for (const table of ['"user"', "account", "guestbook_messages"])
      console.log(table, (await client.query(`select count(*) from ${table}`)).rows[0].count);
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

void main();
