import { Context } from "hono";
import { db } from "../drizzle/db.js";
import { blocks, connections } from "../drizzle/schema.js";
import { eq, or } from "drizzle-orm";
import { and } from "drizzle-orm";

export const disconnectFromUser = async (c: Context) => {
  try {
    console.log("disconnecting from user!");
    const { userId } = c.get("tokenPayload");
    const userToDisconnectFrom: string = await c.req.text();
    await db
      .delete(connections)
      .where(
        or(
          and(
            eq(connections.connectedUser1, userId),
            eq(connections.connectedUser2, userToDisconnectFrom)
          ),
          and(
            eq(connections.connectedUser2, userId),
            eq(connections.connectedUser1, userToDisconnectFrom)
          )
        )
      );

    return c.json(
      {
        message: "User " + userToDisconnectFrom + " was disconnected from you",
      },
      200
    );
  } catch (error) {
    console.log("error in 'disconnect-from-user' route:", error);
    return c.json(
      { message: "error in 'disconnect-from-user' route:" + error },
      500
    );
  }
};
