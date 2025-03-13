import { Socket } from "socket.io";
import { db } from "../../drizzle/db.js";
import { users } from "../../drizzle/schema.js";
import { eq } from "drizzle-orm";
import { fetchUndeliveredEventsFromDatabase as fetchMissedEventsFromDatabase } from "./fetch-undelivered-events-from-database.js";
import { verifyToken } from "../../config/jwt.js";
import {
  EmitResponse,
  SetCurrentlyConnectedPayload,
  SetCurrentlyConnectedResponseType,
} from "../../../../types/types.js";

//set as "currently connected" + join a room + if this is a reconnection, deliver the missed events
export async function setCurrentlyConnected(
  this: Socket,
  { token }: SetCurrentlyConnectedPayload,
  callback: (
    emitResponse: EmitResponse<SetCurrentlyConnectedResponseType>
  ) => void
) {
  try {
    const payload = (await verifyToken(token)) as { userId: string };
    if (!payload || !payload.userId) throw new Error("Invalid token");
    const userId = payload.userId;

    //store the userId in the socket data
    const socket = this;
    socket.data.userId = userId;
    //set "currently_connected" to true
    await db
      .update(users)
      .set({ currentlyConnected: true })
      .where(eq(users.userId, userId));
    console.log("user " + userId + " is now currently connected");

    // the client joins a room named the userId. Helpful for sending a message
    socket.join(userId);

    //make sure the client received all undelivered events
    const lastReceivedEventId: string | undefined =
      socket.handshake.auth.lastReceivedEventId; //last successfully received event id

    if (lastReceivedEventId) {
      // this is a reconnection. the user is in the app and needs to see the new events now!
      for (const event of await fetchMissedEventsFromDatabase(
        userId,
        lastReceivedEventId
      )) {
        socket.emit("newEvent", event);
      }
    } else {
      // this is a first connection. do nothing. The client will get his data using axios.
    }
    // indicates everything is ok
    callback({ error: null, response: { success: true } });
  } catch (error) {
    console.log(
      "error trying to set currentlyConnected or deliver pending messages from the database: ",
      error
    );
    callback({
      error: new Error(
        "error trying to set currentlyConnected or deliver pending messages from the database: ",
        { cause: error }
      ),
    });
  }
}
