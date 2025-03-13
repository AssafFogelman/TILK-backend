import { eq, or, desc, isNotNull, and, asc, sql } from "drizzle-orm";
import { Context } from "hono";
import { chats, chatMessages, users } from "../drizzle/schema.js";
import { db } from "../drizzle/db.js";
import { MessageType } from "../../../types/types.js";

//get the chat messages
export async function getChatMessages(c: Context) {
  try {
    const { userId } = c.get("tokenPayload");
    const chatId = c.req.param("chatId");

    const messages: MessageType[] = await db.query.chatMessages.findMany({
      where: eq(chatMessages.chatId, chatId),
      orderBy: [
        sql`CASE 
              WHEN ${chatMessages.senderId} = ${userId} THEN ${chatMessages.sentDate}
              ELSE ${chatMessages.receivedDate}
            END`,
      ],
      /* the order of the messages is determined by when the user sent the message 
          (for a sent message), and by when the user received the message (for a received message)*/
    });

    // Check if chat exists (if needed)
    if (messages.length === 0) {
      // verify the chat actually exists and not just empty
      const chatExists = await db.query.chats.findFirst({
        where: eq(chats.chatId, chatId),
        columns: {
          chatId: true,
        },
      });

      if (!chatExists) {
        throw new Error("Chat not found");
      }

      // the chat exists but has no messages
      return c.json([], 200);
      //no content status code
    }

    return c.json(messages, 200);
  } catch (error) {
    console.log("error getting chat messages: ", error);
    return c.json({ message: "Error getting chat messages", error }, 401);
  }
}
