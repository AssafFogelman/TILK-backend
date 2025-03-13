import { Context } from "hono";
import { db } from "../drizzle/db.js";
import { and, eq } from "drizzle-orm";
import { blocks, users } from "../drizzle/schema.js";
import { BlockedUserType } from "../../../types/types.js";

export const unblockUser = async (c: Context) => {
  try {
    const { userId } = c.get("tokenPayload");
    const { blockedUserId } = await c.req.json();
    await db
      .delete(blocks)
      .where(
        and(
          eq(blocks.blockingUserId, userId),
          eq(blocks.blockedUserId, blockedUserId)
        )
      );

    return c.json({ message: "User " + blockedUserId + " unblocked" }, 200);
  } catch (error) {
    console.log('error in "unblocked-user" route:', error);
    return c.json({ message: 'error in "unblocked-user" route:' + error }, 500);
  }
};
