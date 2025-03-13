import { io } from "../../index.js";
import { and, eq, sql } from "drizzle-orm";
import {
  chatMessages,
  chats,
  unreadEvents,
  users,
} from "../../drizzle/schema.js";
import { db } from "../../drizzle/db.js";
import {
  EmitResponse,
  MessageDeliveredPayload,
  MessageDeliveredResponseType,
  MessageType,
} from "../../../../types/types.js";
import { TilkEventType } from "../../backend-types/TilkEventType.js";
import { Socket } from "socket.io";

export async function messageDelivered(
  this: Socket,
  { receivedDate, messageId, chatId }: MessageDeliveredPayload,
  callback: (emitResponse: EmitResponse<MessageDeliveredResponseType>) => void
) {
  try {
    const socket = this;
    const userId = socket.data.userId;
    // Mark chat message as delivered
    const deliveredMessage: MessageType = (
      await db
        .update(chatMessages)
        .set({ receivedDate: new Date(receivedDate) })
        .where(
          and(
            eq(chatMessages.chatId, chatId),
            eq(chatMessages.messageId, messageId)
          )
        )
        .returning()
    )[0];

    //update the chats table

    //who is participant1 of the chat?
    const chat = await db.query.chats.findFirst({
      where: eq(chats.chatId, chatId),
      columns: { participant1: true },
    });

    await db
      .update(chats)
      .set({
        ...(userId === chat?.participant1
          ? { readByP1: false, unreadCountP1: sql`${chats.unreadCountP1} + 1` }
          : {
              readByP2: false,
              unreadCountP2: sql`${chats.unreadCountP2} + 1`,
            }),
        lastMessageDate: new Date(receivedDate),
        lastMessageSender: deliveredMessage.senderId,
        lastMessageText: deliveredMessage.text,
      })
      .where(eq(chats.chatId, chatId));

    //update the unreadEvents table
    await db
      .insert(unreadEvents)
      .values({
        userId: deliveredMessage.recipientId,
        eventType: TilkEventType.MESSAGE,
        chatId: chatId,
        messageId: messageId,
        receivedDate: new Date(receivedDate),
      })
      .onConflictDoNothing();

    //inform the sender that the message was delivered
    // Check if sender is online
    const sender = await db.query.users.findFirst({
      where: eq(users.userId, deliveredMessage.senderId),
      columns: { currentlyConnected: true },
    });

    if (sender?.currentlyConnected) {
      console.log(
        "sender is online, emitting that the sent message was delivered"
      );
      console.log(
        `Attempting to emit confirmation to sender ${deliveredMessage.senderId}`
      );
      console.log("");
      console.log(`Active socket rooms:`, io.sockets.adapter.rooms);
      // If online, emit immediately
      //we assigned him to a room whose name is his user Id when he connected.
      //so we can emit to him directly
      io.to(deliveredMessage.senderId).emit(
        "messageDelivered",
        deliveredMessage
      );
    }
    // If websocket is offline, forget about it. we will not send a notification that the message has been delivered.
    // the user will get it through axios when they load the app
    callback({ error: null, response: { success: true } });
  } catch (error) {
    console.log("error marking message as delivered:", error);
    callback({
      error: new Error("Error marking message as delivered"),
    });
  }
}
