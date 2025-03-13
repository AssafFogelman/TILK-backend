import { Context } from "hono";
import { db } from "../drizzle/db.js";
import { eq } from "drizzle-orm";
import { users } from "../drizzle/schema.js";

export const userData = async (c: Context) => {
  try {
    const payload = c.get("tokenPayload");
    const user = await db.query.users.findFirst({
      where: eq(users.userId, payload.userId),
      with: {
        tagsUsers: {
          columns: {
            tagName: true,
          },
        },
      },
    });
    return c.json(
      {
        message: "the token is valid. here are the details of the user",
        user: user,
      },
      200
    );
  } catch (error) {
    console.log('error in "user-data" route:', error);
    return c.json({ message: 'error in "user-data" route:' + error }, 401);
  }
};
