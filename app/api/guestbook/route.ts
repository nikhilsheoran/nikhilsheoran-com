import { auth } from "@/lib/auth-server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const MAX_LENGTH = 280;

/** The newest messages, in the shape the guestbook view expects. */
export async function GET() {
  const { rows } = await db.query(
    `select id, name, avatar_url, message, created_at
       from guestbook_messages
      order by created_at desc
      limit 200`,
  );
  return Response.json(
    rows.map((row) => ({
      _id: row.id as string,
      _creationTime: (row.created_at as Date).getTime(),
      name: row.name as string,
      avatarUrl: (row.avatar_url as string | null) ?? undefined,
      message: row.message as string,
    })),
  );
}

/** Add a message as the signed-in person. */
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session)
    return Response.json({ error: "Not signed in" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { message?: unknown } | null;
  const message =
    typeof body?.message === "string" ? body.message.trim().slice(0, MAX_LENGTH) : "";
  if (!message)
    return Response.json({ error: "Message cannot be empty" }, { status: 400 });

  await db.query(
    `insert into guestbook_messages (user_id, name, avatar_url, message) values ($1, $2, $3, $4)`,
    [session.user.id, session.user.name, session.user.image ?? null, message],
  );
  return Response.json({ ok: true }, { status: 201 });
}
