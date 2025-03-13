import { io } from "../../index.js";
import { and, eq, lte, ne, sql } from "drizzle-orm";
import {
  chatMessages,
  chats,
  unreadEvents,
  users,
} from "../../drizzle/schema.js";
import { db } from "../../drizzle/db.js";
import {
  EmitResponse,
  MessagesReadPayload,
  MessagesReadResponseType,
  MessageType,
} from "../../../../types/types.js";
import { TilkEventType } from "../../backend-types/TilkEventType.js";
import { Socket } from "socket.io";

export async function onMessagesRead(
  this: Socket,
  { chatId, lastUnreadMessageReceivedDate }: MessagesReadPayload,
  callback: (emitResponse: EmitResponse<MessagesReadResponseType>) => void
) {
  try {
    if (!lastUnreadMessageReceivedDate)
      throw new Error("no unread message received date"); //if there is no unread message, report an error
    if (!chatId) throw new Error("no chatId"); //if there is no chatId, report an error

    const userId = this.data.userId;
    // Mark all received chat messages of the specific chat as read and return the last received message that was read
    const lastReadMessage: MessageType = (
      await db
        .update(chatMessages)
        .set({ unread: false })
        .where(
          and(
            eq(chatMessages.chatId, chatId),
            ne(chatMessages.senderId, userId),
            lte(
              chatMessages.receivedDate,
              new Date(lastUnreadMessageReceivedDate)
            ),
            eq(chatMessages.unread, true) //target only the received message that was unread
          )
        )
        .returning({
          messageId: chatMessages.messageId,
          sentDate: chatMessages.sentDate,
          receivedDate: chatMessages.receivedDate,
          text: chatMessages.text,
          senderId: chatMessages.senderId,
          recipientId: chatMessages.recipientId,
          chatId: chatMessages.chatId,
          unread: chatMessages.unread,
          gotToServer: chatMessages.gotToServer,
          orderBy: chatMessages.receivedDate, //we are only talking about received messages
          limit: sql`1`,
        })
    )[0];

    //is the client participant1 or participant2?
    const isParticipant1 =
      (
        await db.query.chats.findFirst({
          where: eq(chats.chatId, chatId),
          columns: { participant1: true },
        })
      )?.participant1 === userId;

    //update the chats table that the user read the message (or at least entered the chat)
    await db
      .update(chats)
      .set({
        ...(isParticipant1
          ? {
              readByP1: true,
              unreadCountP1: 0,
            }
          : {
              readByP2: true,
              unreadCountP2: 0,
            }),
        // update lastReadMessage only if there are chat messages
        ...(lastReadMessage && {
          [isParticipant1 ? "lastReadMessageP1" : "lastReadMessageP2"]:
            lastReadMessage.messageId,
        }),
      })
      .where(eq(chats.chatId, chatId));

    //indicate that the server received the event
    callback({ error: null, response: { success: true } });

    if (!lastReadMessage) return; //no message was read. no need to update.

    //delete the unreadEvents from the DB
    await db
      .delete(unreadEvents)
      .where(
        and(
          eq(unreadEvents.eventType, TilkEventType.MESSAGE),
          eq(unreadEvents.userId, lastReadMessage.recipientId),
          eq(unreadEvents.chatId, chatId)
        )
      );

    //inform the sender that the message was read
    // Check if sender is online
    const sender = await db.query.users.findFirst({
      where: eq(users.userId, lastReadMessage.senderId),
      columns: { currentlyConnected: true },
    });

    if (sender?.currentlyConnected) {
      // If online, emit immediately
      //we assigned him to a room whose name is his user Id when he connected.
      //so we can emit to him directly
      console.log("we want to tell the sender that his messages were read ");
      io.to(lastReadMessage.senderId).emit("messagesRead", {
        chatId: lastReadMessage.chatId,
        sentDate: lastReadMessage.sentDate,
        senderId: lastReadMessage.senderId,
      });
    }

    // If websocket is offline, forget about it. we will not send a notification that the message has been read.
    // the user will get it through axios when they load the app
  } catch (error) {
    console.log("error marking message as read:", error);
    callback({
      error: new Error("error marking message as read", { cause: error }),
    });
  }
}
