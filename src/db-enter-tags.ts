import { db } from "./drizzle/db.js";
import {
  tagCategories,
  tags,
  tagsTagCats,
  tagsUsers,
} from "./drizzle/schema.js";
import data from "../data/categories_and_tags.json" assert { type: "json" };
import { sql } from "drizzle-orm";
/*
 * mind you that there may very well be duplicate categories and duplicate tags of different categories.
 * but there can't be duplicate tags of the same category.
 */

const enterTags = async () => {
  try {
    //we need to connect to the database. I've deleted the previous connection since it showed the password.

    //clear the current tags
    await db.delete(tagsUsers);
    await db.delete(tagsTagCats);
    await db.delete(tags);
    await db.delete(tagCategories);

    //insert categories and tags
    await Promise.all(
      data.map(async (tagItem) => {
        //insert a category
        const CategoryId = await db
          .insert(tagCategories)
          .values({ categoryName: tagItem.categoryName.toLowerCase() })
          .returning({ id: tagCategories.tagCategoryId })
          .then((result) => result[0].id);

        //insert the category's tags
        const tagNames = await db
          .insert(tags)
          .values(
            tagItem.tags.map((tag) => ({
              tagName: tag.tagContent.toLowerCase(),
            }))
          )
          .onConflictDoUpdate({
            target: tags.tagName,
            set: { tagName: sql`excluded.tag_Name` },
          })
          .returning({ tagName: tags.tagName })
          .then((result) => result.map((result) => result.tagName));

        //create an array of tag-category couples
        const catsToTags = tagNames.map((tagName) => ({
          tagName: tagName,
          tagCategoryId: CategoryId,
        }));

        await db.insert(tagsTagCats).values(catsToTags).onConflictDoNothing();
      })
    );
  } catch (error) {
    console.log("problem entering tags: ", error);
  }
};

enterTags();
