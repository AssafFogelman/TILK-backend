import { Context } from "hono";
import { db } from "../drizzle/db.js";
import { users } from "../drizzle/schema.js";
import { eq } from "drizzle-orm";
import { Expo } from "expo-server-sdk";

export const upsertExpoPushToken = async (c: Context) => {
  try {
    const { userId } = c.get("tokenPayload");
    const { expoPushToken } = await c.req.json();

    //validate the expo push token
    if (!Expo.isExpoPushToken(expoPushToken)) {
      throw new Error("Invalid Expo push token");
    }

    //update the user with the new expo push token
    await db
      .update(users)
      .set({ expoPushToken })
      .where(eq(users.userId, userId));

    return c.json({ message: "Push token updated successfully" }, 200);
  } catch (error) {
    console.error("Error updating push token:", error);
    return c.json({ message: "Error updating push token", error }, 500);
  }
};
