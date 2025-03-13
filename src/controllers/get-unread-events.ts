import { Context } from "hono";
import { db } from "../drizzle/db";
import { chatMessages } from "../drizzle/schema";
import { unreadEvents } from "../drizzle/schema";
import { and, eq } from "drizzle-orm";
import { TilkEvent, TilkEvents, TilkEventType } from "../../../types/types";

export async function getUnreadEvents(c: Context) {
  try {
    const { userId }: { userId: string } = c.get("tokenPayload");
    /*
    there are 3 types of events currently:
    1. new message
    2. new connection request
    3. a user near you is looking for the same thing
    
    for now I will only focus on the first type of event - unread messages
    */

    //get all unread events for the user
    const theUnreadEvents = await db
      .select({
        eventType: unreadEvents.eventType,
        chatId: unreadEvents.chatId,
        messageId: unreadEvents.messageId,
        text: chatMessages.text,
        sentDate: chatMessages.sentDate,
        senderId: chatMessages.senderId,
      })
      .from(unreadEvents)
      .leftJoin(
        chatMessages,
        // this is an attempt to make the query faster since chatMessages are indexed by chatId.
        and(
          eq(unreadEvents.chatId, chatMessages.chatId),
          eq(unreadEvents.messageId, chatMessages.messageId)
        )
      )
      .where(and(eq(unreadEvents.userId, userId)));

    //reduce the unread events to a single object with the event type as the key and the events as the value.
    //if there are no events for a particular event type, it will not be included in the final object.
    const finalUnreadEvents = theUnreadEvents.reduce<TilkEvents>(
      (acc, event) => {
        const eventType = event.eventType as TilkEventType;

        if (!acc[eventType]) {
          acc[eventType] = [];
        }

        acc[eventType]?.push(event as TilkEvent);
        return acc;
      },
      {}
    );
    return c.json(finalUnreadEvents, 200);
  } catch (error) {
    console.log("error getting unread events: ", error);
    return c.json({ message: "Error getting unread events", error }, 401);
  }
}
