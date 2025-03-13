import {
  EmitResponse,
  MessageType,
  NewEventPayload,
  NewEventResponseType,
} from "../../../../types/types.js";
import { TilkEventType } from "../../backend-types/TilkEventType.js";
import { onNewMessage as onNewMessage } from "./on-new-message-server.js";

export async function onNewEvent(
  { newMessage, eventType }: NewEventPayload,
  callback: (emitResponse: EmitResponse<NewEventResponseType>) => void
) {
  //because it is inside an object, sentDate and receivedDate are strings. we need to convert them to a date.
  //you would think websocket would conserve the date as a date, but it doesn't.

  try {
    switch (eventType) {
      case TilkEventType.MESSAGE:
        await onNewMessage(newMessage, callback);
        break;
      default:
        console.error("unknown event type:", eventType);
        callback({ error: new Error(`Unknown event type: ${eventType}`) });
    }
  } catch (error) {
    console.log("error sending event:", error);
    callback({ error: new Error("error sending event", { cause: error }) });
  }
}
