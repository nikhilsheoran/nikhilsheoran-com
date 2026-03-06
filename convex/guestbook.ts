import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { authComponent } from "./auth";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("guestbookMessages").order("desc").take(200);
  },
});

export const add = mutation({
  args: {
    message: v.string(),
  },
  handler: async (ctx, { message }) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }
    const trimmed = message.trim().slice(0, 280);
    if (!trimmed) {
      throw new Error("Message cannot be empty");
    }
    await ctx.db.insert("guestbookMessages", {
      userId: user._id as string,
      name: user.name,
      avatarUrl: user.image ?? undefined,
      message: trimmed,
    });
  },
});
