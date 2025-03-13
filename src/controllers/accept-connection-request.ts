import { Context } from "hono";
import { db } from "../drizzle/db.js";
import { connectionRequests, connections } from "../drizzle/schema.js";
import { and, eq } from "drizzle-orm";

export const acceptConnectionRequest = async (c: Context) => {
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

    // add the sender to the connections list, ensuring correct order of IDs
    const connectionsList = await db.insert(connections).values({
      connectedUser1: userId < senderId ? userId : senderId,
      connectedUser2: userId < senderId ? senderId : userId,
    });

    return c.json(connectionsList, 200);
  } catch (error) {
    console.log("error in accept-connection-request route:", error);
    return c.json(
      { message: "error in accept-connection-request route:" + error },
      500
    );
  }
};
