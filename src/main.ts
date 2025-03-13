import { eq, ne, sql } from "drizzle-orm";
import { db } from "./drizzle/db.js";
import {
  connections,
  tagCategories,
  tags,
  tagsTagCats,
  tagsUsers,
  users,
} from "./drizzle/schema.js";

type UserType = typeof users.$inferInsert;

const exampleUsers: UserType[] = [
  {
    phoneNumber: "+972-54-6735391",
    gender: "man",
    nickname: "markolit",
    dateOfBirth: "1983-01-13",
    // lon: 32.741117510490035,
    // lat: 35.07818495364527,
  },
  {
    phoneNumber: "+972-54-6735392",
    gender: "man",
    nickname: "kolbo",
    dateOfBirth: "1983-01-13",
    // lon: 32.739824774535585,
    // lat: 35.07939731201617,
  },
  {
    phoneNumber: "+972-54-6735393",
    gender: "man",
    nickname: "lagin",
    dateOfBirth: "1983-01-13",
    // lon: 32.745742678343774,
    // lat: 35.07383674499869,
  },
];

async function main() {
  try {
    //*deleting all former users:
    // await db.delete(users).where(ne(users.gender, "woman"));

    //* adding cities:
    // await db.insert(users).values({
    //   phoneNumber: "+972-54-6735391",
    //   gender: "man",
    //   nickname: "Holon",
    //   locationDate: new Date(),
    //   dateOfBirth: "1983-01-13",
    // });

    // * inserting locations
    // const coordinates = {
    //   Holon: { lon: 32.01528, lat: 34.7875 },
    //   TelAviv: { lon: 32.06694, lat: 34.77778 },
    //   Jerusalem: { lon: 31.76944, lat: 35.21306 },
    //   Haifa: { lon: 32.79639, lat: 34.98444 },
    //   Eilat: { lon: 29.56, lat: 34.95111 },
    // };
    // const sqlQuery = sql.raw(
    //   `UPDATE users
    //    SET user_location=ST_MakePoint(${coordinates.Holon.lon},${coordinates.Holon.lat})
    //    WHERE nickname='Holon';`
    // );
    // await db.execute(sqlQuery);

    //* getting the 10 nearest cities to "Hasataf" creek
    /* showing results up to 10 KM */

    //*insert tags and tag categories:
    // Insert tags
    // const insertedTags = await db
    //   .insert(tags)
    //   .values([
    //     {
    //       tagContent: "bowling",
    //     },
    //     {
    //       tagContent: "fishing",
    //     },
    //     {
    //       tagContent: "anime",
    //     },
    //     {
    //       tagContent: "sushi",
    //     },
    //     {
    //       tagContent: "sumo",
    //     },
    //     {
    //       tagContent: "extra ketchup",
    //     },
    //   ])
    //   .returning()
    //   .onConflictDoNothing();

    // // Insert categories
    // const insertedCategories = await db
    //   .insert(tagCategories)
    //   .values([
    //     { categoryName: "sports" },
    //     { categoryName: "Japan" },
    //     { categoryName: "food" },
    //   ])
    //   .returning()
    //   .onConflictDoNothing();

    // // Link templates and categories
    // await db
    //   .insert(tagsTagCats)
    //   .values([
    //     {
    //       tagId: insertedTags[0].tagId,
    //       tagCategoryId: insertedCategories[0].tagCategoryId,
    //     },
    //     {
    //       tagId: insertedTags[1].tagId,
    //       tagCategoryId: insertedCategories[0].tagCategoryId,
    //     },
    //     {
    //       tagId: insertedTags[2].tagId,
    //       tagCategoryId: insertedCategories[1].tagCategoryId,
    //     },
    //     {
    //       tagId: insertedTags[3].tagId,
    //       tagCategoryId: insertedCategories[1].tagCategoryId,
    //     },
    //     {
    //       tagId: insertedTags[3].tagId,
    //       tagCategoryId: insertedCategories[2].tagCategoryId,
    //     },
    //     {
    //       tagId: insertedTags[4].tagId,
    //       tagCategoryId: insertedCategories[1].tagCategoryId,
    //     },
    //     {
    //       tagId: insertedTags[4].tagId,
    //       tagCategoryId: insertedCategories[0].tagCategoryId,
    //     },
    //     {
    //       tagId: insertedTags[5].tagId,
    //       tagCategoryId: insertedCategories[2].tagCategoryId,
    //     },
    //   ])
    //   .onConflictDoNothing();

    //insert user specific tags
    const foundTemplates = await db.query.tags.findMany({});
    const id_972546735391 = "a8d8bbc4-6ae9-4f0c-87ca-2cb4da6a210c";

    await db
      .insert(tagsUsers)
      .values([
        {
          userId: id_972546735391,
          tagId: foundTemplates[0].tagId,
        },
        {
          userId: id_972546735391,
          tagId: foundTemplates[1].tagId,
        },
        {
          userId: id_972546735391,
          tagId: foundTemplates[2].tagId,
        },
        {
          userId: id_972546735391,
          tagId: foundTemplates[3].tagId,
        },
        {
          userId: id_972546735391,
          tagId: foundTemplates[4].tagId,
        },
        {
          userId: id_972546735391,
          tagId: foundTemplates[5].tagId,
        },
      ])
      .onConflictDoNothing();

    // Query to get all tags with their categories

    const tagsWithCategoriesAndUsers = await db
      .select({
        tagId: tags.tagId,
        tagContent: tags.tagName,
        categories: sql<
          string[]
        >`array_agg(distinct ${tagCategories.categoryName})`,
        users: sql<string[]>`array_agg(distinct ${users.phoneNumber})`,
      })
      .from(tags)
      .leftJoin(tagsTagCats, eq(tags.tagId, tagsTagCats.tagId))
      .leftJoin(
        tagCategories,
        eq(tagsTagCats.tagCategoryId, tagCategories.tagCategoryId)
      )
      .leftJoin(tagsUsers, eq(tags.tagId, tagsUsers.tagId))
      .leftJoin(users, eq(tagsUsers.userId, users.userId))
      .groupBy(tags.tagId, tags.tagName);

    console.log("tagsWithCategoriesAndUsers:", tagsWithCategoriesAndUsers);

    //*! look in: https://orm.drizzle.team/docs/joins#aggregating-results

    /********************************************************************* */
    //* fetching templates
    // await db.query.tagCategories.findFirst({
    //   with: {
    //     tagTemplates: true,
    //   },
    // });

    // await db.query.tagTemplates.findFirst({
    //   with: {
    //     tagCategories: true,
    //   },
    // });
    // //entering exampleUsers
    // await db.insert(users).values(exampleUsers).onConflictDoNothing();

    //*entering exampleUser's location
    // const sqlQuery = sql.raw(
    //   `UPDATE users
    //    SET user_location=ST_MakePoint(${coordinates.Holon.lon},${coordinates.Holon.lat})
    //    WHERE nickname='Holon';`
    // );
    // await db.execute(sqlQuery);

    // *entering exampleUser's location, one by one...
    // await db.execute(
    //   sql.raw(`
    //   UPDATE users
    //   SET user_location=ST_MakePoint(${exampleUsers[2].lon},${exampleUsers[2].lat})
    //   WHERE nickname='lagin';`)
    // );

    // * finding KNN
    // const knn = `
    // SELECT nickname, user_location <-> ST_MakePoint(31.77185142779806, 35.12806329924837) AS distance
    // FROM users
    // WHERE user_location <-> ST_MakePoint(31.77185142779806, 35.12806329924837)<10000
    // ORDER BY distance
    // LIMIT 10;`;
    // const closestCities = await db.execute(sql.raw(knn));
    // console.log("closestCities:", closestCities);
    /************ */
    // const users1 = await db.query.users.findMany();
    // console.log("users:", users1);
  } catch (error) {
    console.log('there was an error trying to execute function "main":', error);
  }
}

main();
