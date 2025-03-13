import { Context } from "hono";
import { db } from "../drizzle/db";
import { eq } from "drizzle-orm";
import { users } from "../drizzle/schema";

export const activateUser = async (c: Context) => {
  try {
    const { userId } = c.get("tokenPayload");
    await db
      .update(users)
      .set({ activeUser: true })
      .where(eq(users.userId, userId));
    return c.json(
      {
        message: "the user is now active",
      },
      200,
    );
  } catch (error) {
    console.log('error in "activate-user" route:', error);
    return c.json({ message: 'error in "activate-user" route:' + error }, 401);
  }
};
