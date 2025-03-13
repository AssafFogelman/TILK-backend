import { Socket } from "socket.io";
import TilkEventType from "../../backend-types/TilkEventType.js";
import { messageDelivered } from "./on-message-delivered-server.js";
import {
  EmitResponse,
  EventDeliveredPayload,
  MessageDeliveredResponseType,
} from "../../../../types/types.js";

export async function eventDelivered(
  this: Socket,
  { receivedDate, messageId, chatId, eventType }: EventDeliveredPayload,
  callback: (emitResponse: EmitResponse<MessageDeliveredResponseType>) => void
) {
  try {
    switch (eventType) {
      case TilkEventType.MESSAGE:
        //.call insures that the function is called with the correct socket context
        await messageDelivered.call(
          this,
          {
            receivedDate,
            messageId,
            chatId,
          },
          callback
        );
        break;
      default:
        console.error("unknown event type:", eventType);
        callback({
          error: new Error("Unknown event type"),
          response: undefined,
        });
    }
    //acknowledge the event was emitted successfully
    callback({ error: null, response: { success: true } });
  } catch (error) {
    console.log("error marking event as delivered:", error);
    callback({
      error: new Error("Error marking event as delivered"),
      response: { success: false },
    });
  }
}
