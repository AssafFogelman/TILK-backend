import { and, eq, gt } from "drizzle-orm";
import { chatMessages } from "../../drizzle/schema.js";
import { db } from "../../drizzle/db.js";
import TilkEventType from "../../backend-types/TilkEventType.js";
export async function fetchUndeliveredEventsFromDatabase(userId, lastReceivedEventId) {
    try {
        /************* in case the event is a message *************/
        const missedMessages = await db.query.chatMessages.findMany({
            where: and(eq(chatMessages.recipientId, userId), gt(chatMessages.eventId, lastReceivedEventId)),
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
        });
        return [...formattedMissedMessages /*, ...missedOtherEvents*/];
    }
    catch (error) {
        console.error("Error fetching missed events from database", error);
        return [];
    }
}
