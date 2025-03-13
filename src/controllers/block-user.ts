import { Context } from "hono";
import { db } from "../drizzle/db.js";
import { blocks, chats } from "../drizzle/schema.js";
import { eq } from "drizzle-orm";

export const blockUser = async (c: Context) => {
  try {
    const { userId } = c.get("tokenPayload");
    const { blockedUserId } = await c.req.json();
    await db.insert(blocks).values({
      blockingUserId: userId,
      blockedUserId: blockedUserId,
    });

    return c.json({ message: "User " + blockedUserId + " blocked" }, 200);
  } catch (error) {
    console.log('error in "blocked-user" route:', error);
    return c.json({ message: 'error in "blocked-user" route:' + error }, 500);
  }
};
