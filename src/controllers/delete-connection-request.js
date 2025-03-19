import { db } from "../drizzle/db.js";
import { connectionRequests } from "../drizzle/schema.js";
import { and, eq } from "drizzle-orm";
export const deleteConnectionRequest = async (c) => {
    try {
        const { userId } = c.get("tokenPayload");
        const { recipientId } = await c.req.json();
        const connectionRequest = await db
            .delete(connectionRequests)
            .where(and(eq(connectionRequests.recipientId, recipientId), eq(connectionRequests.senderId, userId)));
        return c.json(connectionRequest, 200);
    }
    catch (error) {
        console.log("error in delete-connection-request route:", error);
        return c.json({ message: "error in delete-connection-request route:" + error }, 500);
    }
};
