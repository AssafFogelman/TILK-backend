import { Context } from "hono";
import { db } from "../drizzle/db.js";
import { connectionRequests } from "../drizzle/schema.js";
import { and, eq } from "drizzle-orm";

export const declineConnectionRequest = async (c: Context) => {
  try {
    const { userId }: { userId: string } = c.get("tokenPayload");

    const { senderId }: { senderId: string } = await c.req.json();

    // delete the connection request from the database
    await db
      .delete(connectionRequests)
      .where(
        and(
          eq(connectionRequests.recipientId, userId),
          eq(connectionRequests.senderId, senderId)
        )
      );

    return c.json({ message: "connection request declined" }, 200);
  } catch (error) {
    console.log("error in decline-connection-request route:", error);
    return c.json(
      { message: "error in decline-connection-request route:" + error },
      500
    );
  }
};
