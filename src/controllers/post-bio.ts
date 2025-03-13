import { Context } from "hono";
import { db } from "../drizzle/db";
import { eq } from "drizzle-orm";
import { users } from "../drizzle/schema";

/*
    check for html malicious content
    update bio
    update nickname
    update gender
    update date of birth
 */

export const postBio = async (c: Context) => {
  try {
    const { userId } = c.get("tokenPayload");

    type BioInputsType = {
      biography: string;
      nickname: string;
      gender: string;
      dateOfBirth: string | null;
    };

    let { biography, nickname, gender, dateOfBirth } =
      (await c.req.json()) as BioInputsType;

    //verify that the input isn't HTML
    biography = biography.replaceAll("<", "");
    nickname = nickname.replaceAll("<", "");

    //verify "gender" is only one of three options
    if (gender !== "man" && gender !== "woman" && gender !== "other") {
      throw { message: "invalid gender supplied" };
    }

    //verify biography is at least 10 characters long
    if (biography.length < 10) {
      throw { message: "invalid biography supplied" };
    }
    if (dateOfBirth !== null) {
      //verify dateOfBirth is in an "MM/DD/YYYY" or "YYYY-MM-DD" pattern.
      const MMDDYYYY = new RegExp(
        "(0[1-9]|1[012])\\/(0[1-9]|[12][0-9]|3[01])\\/(19|20)\\d\\d"
      );
      const YYYYMMDD = new RegExp(
        "^[12][901][0-9][0-9]-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])$"
      );

      if (!MMDDYYYY.test(dateOfBirth) && !YYYYMMDD.test(dateOfBirth)) {
        throw { message: "invalid date of birth supplied" };
      }
    }

    //verify nickname is at least 3 characters long
    if (nickname.length < 3) {
      throw { message: "invalid nickname supplied" };
    }

    //update the user in the DB
    await db
      .update(users)
      .set({
        gender,
        biography,
        dateOfBirth,
        nickname,
      })
      .where(eq(users.userId, userId));

    return c.json({ message: "user bio updated successfully." }, 200);
  } catch (error) {
    console.log('error in "post-bio" route:', error);
    return c.json({ message: 'error in "post-bio" route', error }, 401);
  }
};
