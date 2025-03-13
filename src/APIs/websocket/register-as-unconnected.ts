import { Socket } from "socket.io";
import { db } from "../../drizzle/db.js";
import { users } from "../../drizzle/schema.js";
import { eq } from "drizzle-orm";

export async function registerAsUnconnected(this: Socket, reason: string) {
  try {
    const socket = this;

    const userId = socket.data.userId;
    console.log(`user ${userId} disconnected because of ${reason}`);

    //set the user that disconnected as not "currently connected" in the DB
    await db
      .update(users)
      .set({ currentlyConnected: false })
      .where(eq(users.userId, userId));
  } catch (error) {
    console.log("error setting user as not currently connected: ", error);
  }
}
