import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/lib/db";

/**
 * Sign-in with Google, kept in the site's own Postgres (Supabase). The
 * tables are created by supabase/migrations.
 */
export const auth = betterAuth({
  database: db,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [
    process.env.NEXT_PUBLIC_SITE_URL!,
    "http://localhost:3000",
    "http://localhost:3001",
  ],
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  plugins: [nextCookies()],
});
