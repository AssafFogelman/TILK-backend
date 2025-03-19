import { db } from "../drizzle/db.js";
import { connectionRequests } from "../drizzle/schema.js";
export const postConnectionRequest = async (c) => {
    try {
        const { userId } = c.get("tokenPayload");
        const { recipientId } = await c.req.json();
        const connectionRequest = await db.insert(connectionRequests).values({
            recipientId: recipientId < userId ? recipientId : userId,
            senderId: recipientId < userId ? userId : recipientId,
        });
        return c.json(connectionRequest, 200);
    }
    catch (error) {
        console.log("error in post-connection-request route:", error);
        return c.json({ message: "error in post-connection-request route:" + error }, 500);
    }
};
