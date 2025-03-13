import { Context } from "hono";
import { db } from "../drizzle/db.js";
import {
  tagCategories,
  tags,
  tagsTagCats,
  tagsUsers,
} from "../drizzle/schema.js";
import { and, eq, inArray, sql } from "drizzle-orm";

export const postTags = async (c: Context) => {
  try {
    const { userId } = c.get("tokenPayload");

    const tagsArray = (await c.req.json()) as string[];

    //do the tags exist in the database?

    // Check if all tags in tagsArray exist in the tags table
    const existingTags = new Set(
      (
        await db
          .select({ tagName: tags.tagName })
          .from(tags)
          .where(inArray(tags.tagName, tagsArray))
      ).map((tag) => tag.tagName)
    );

    // Find tags that don't exist in the database
    const nonExistentTags = tagsArray.filter((tag) => !existingTags.has(tag));

    if (nonExistentTags.length > 0) {
      throw {
        message: "Some tags do not exist in the database",
        nonExistentTags,
      };
    }

    //Erase existing user tags
    await db.delete(tagsUsers).where(eq(tagsUsers.userId, userId));

    //Insert new entries
    if (tagsArray.length > 0) {
      await db.insert(tagsUsers).values(
        tagsArray.map((tagName) => ({
          userId: userId,
          tagName: tagName.toLocaleLowerCase(),
        }))
      );
    }

    return c.json({ message: "tags were saved successfully" }, 200);
  } catch (error) {
    console.log("error saving tags: ", error);
    return c.json({ message: "Error saving tags", error }, 401);
  }
};
