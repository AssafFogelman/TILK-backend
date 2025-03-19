import { verifyToken } from "../config/jwt.js";
import { db } from "../drizzle/db.js";
import { errorLog } from "../drizzle/schema.js";
/*
  log an error record
 */
export const logError = async (c, next) => {
    try {
        const token = c.req.header("TILK-token");
        let payload;
        // there might not be a token since the error might arise before the user registered.
        // in that case there will not bea token in the request header.
        if (token) {
            payload = (await verifyToken(token));
        }
        const userId = payload?.userId || null;
        let { error, info } = (await c.req.json());
        await db.insert(errorLog).values({
            error: JSON.stringify(error),
            info: JSON.stringify({
                ...info,
            }),
            userId,
        });
        return c.json({ message: "Error record saved!" }, 200);
    }
    catch (error) {
        console.log("error occurred when trying to log the error to the DB: ", error);
        return c.json({
            message: "error occurred when trying to log the error to the DB: ",
            error,
        }, 401);
    }
};
