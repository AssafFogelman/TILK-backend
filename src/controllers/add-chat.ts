import { eq, or, desc, and } from "drizzle-orm";
import { Context } from "hono";
import { chats } from "../drizzle/schema.js";
import { db } from "../drizzle/db.js";

//add chat
export async function addChat(c: Context) {
  try {
    const { userId } = c.get("tokenPayload");
    const { otherUserId } = await c.req.json();

    //check if the chat already exists
    const existingChat = await db.query.chats.findFirst({
      where: and(
        eq(chats.participant1, userId),
        eq(chats.participant2, otherUserId)
      ),
    });

    if (existingChat) {
      throw new Error("Chat already exists");
    }

    // Order the participants to satisfy the CHECK constraint
    // (a chat can be ordered only in one way in order to prevent
    // two chats between the same two users)
    const [participant1, participant2] =
      userId < otherUserId ? [userId, otherUserId] : [otherUserId, userId];

    const { chatId } = (
      await db
        .insert(chats)
        .values({
          participant1: participant1,
          participant2: participant2,
        })
        .returning({ chatId: chats.chatId })
    )[0];

    return c.json({ chatId }, 200);
  } catch (error) {
    console.log("error adding chat: ", error);
    return c.json({ message: "Error adding chat", error }, 500);
  }
}
