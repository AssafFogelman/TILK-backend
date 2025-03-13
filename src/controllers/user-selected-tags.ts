import { Context } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../drizzle/db";
import { tagsUsers } from "../drizzle/schema";

export async function userSelectedTags(c: Context) {
  try {
    const { userId } = c.get("tokenPayload");

    const userSelectedTags = await db
      .select({ tagName: tagsUsers.tagName })
      .from(tagsUsers)
      .where(eq(tagsUsers.userId, userId));

    const userTags = userSelectedTags.map((tag) => tag.tagName);

    return c.json({ userTags }, 200);
  } catch (error) {
    console.error("Error fetching user selected tags:", error);
    return c.json(
      { message: 'error in "user-selected-tags" route:' + error },
      400
    );
  }
}
