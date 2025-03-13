import { and, eq, gt } from "drizzle-orm";
import { chatMessages } from "../../drizzle/schema.js";
import { db } from "../../drizzle/db.js";
import { TilkEvent } from "../../../../types/types.js";
import TilkEventType from "../../backend-types/TilkEventType.js";

export async function fetchUndeliveredEventsFromDatabase(
  userId: string,
  lastReceivedEventId: string
): Promise<TilkEvent[]> {
  try {
    /************* in case the event is a message *************/
    const missedMessages = await db.query.chatMessages.findMany({
      where: and(
        eq(chatMessages.recipientId, userId),
        gt(chatMessages.eventId, lastReceivedEventId)
      ),
    });

    const formattedMissedMessages = missedMessages.map((message) => {
      const baseEvent = {
        otherUserId: message.senderId,
        recipientId: message.recipientId,
        eventId: message.eventId,
      };

      return {
        ...baseEvent,
        eventType: TilkEventType.MESSAGE,
        chatId: message.chatId,
        messageId: message.messageId,
        sentDate: message.sentDate,
        text: message.text || "",
      };
    }) as TilkEvent[];

    return [...formattedMissedMessages /*, ...missedOtherEvents*/];
  } catch (error) {
    console.error("Error fetching missed events from database", error);
    return [];
  }
}
