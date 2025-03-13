import { Context } from "hono";
import { db } from "../drizzle/db";
import { connectionRequests } from "../drizzle/schema";
import { and, eq, inArray } from "drizzle-orm";
import { uuidArraySchema } from "../models/authSchemas";

export const markAsRead = async (c: Context) => {
  try {
    const { userId } = c.get("tokenPayload");

    const rawData = await c.req.json();

    //validating the array of user UUIDs
    const result = uuidArraySchema.safeParse(rawData);
    if (!result.success)
      throw {
        message: "Invalid UUID format in array",
        errors: result.error.issues,
      };

    const requestingUsersArray = result.data;

    //modify the requests to be unread as false

    await db
      .update(connectionRequests)
      .set({ unread: false })
      .where(
        and(
          eq(connectionRequests.recipientId, userId),
          inArray(connectionRequests.senderId, requestingUsersArray)
        )
      );

    return c.json({ message: "connection requests were marked as read" }, 200);
  } catch (error) {
    console.log("error marking connection requests as read: ", error);
    return c.json(
      { message: "Error marking connection requests as read", error },
      401
    );
  }
};
