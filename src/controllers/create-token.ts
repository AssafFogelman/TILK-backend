import { Context } from "hono";
import { compareHash } from "../config/bcrypt.js";
import { db } from "../drizzle/db.js";
import { users } from "../drizzle/schema.js";
import { generateToken } from "../config/jwt.js";

/*  
    the user sends the server the code that he got+phone number+the hash. 
     - the server checks for validity of the hash,
     - the server checks whether the phone number exists in the database.
     - if so, it returns a token
     - if not, it creates a user and returns a token
     the token:
     * userId

     - the server also returns global user attributes: (to be added to the context)
     the attributes:
     * userId
     * chosenAvatar
     * chosenBio
     * chosenTags
     * isAdmin


    create and return a new token containing the new user unique phone ID and phone number and register the user.
    
 */

export const createToken = async (c: Context) => {
  try {
    const {
      phoneNumber,
      code,
      hash,
    }: { phoneNumber: string; code: string; hash: string } = await c.req.json();

    //is the hash valid?
    const hashValid = await compareHash(
      phoneNumber + code + process.env.VALIDATION_KEY,
      hash
    );
    if (!hashValid)
      throw { message: "the hash is not valid! retry the validation process" };

    //does the user exist?
    let existingUser = await db.query.users.findFirst({
      where: (table, funcs) => funcs.eq(table.phoneNumber, phoneNumber),
      with: {
        tagsUsers: {
          columns: {
            tagName: true,
          },
        },
      },
    });

    //if not, create user
    let newUser;
    if (!existingUser) {
      newUser = await db
        .insert(users)
        .values({
          phoneNumber: phoneNumber,
        })
        .returning({ userId: users.userId });
      console.log("newUser:", newUser);
    }
    const userId = newUser ? newUser[0].userId : existingUser?.userId;
    // create token
    const token = await generateToken({ userId: userId }, "365d");
    console.log("the token:", token);
    return c.json({
      token: token,
      userId: userId,
      chosenAvatar: existingUser && existingUser.smallAvatar ? true : false,
      chosenBio: existingUser && existingUser.biography ? true : false,
      chosenTags: existingUser && existingUser.tagsUsers.length ? true : false,
      isAdmin: existingUser ? existingUser.admin : false,
      offGrid: existingUser ? existingUser.offGrid : false,
    });
  } catch (error) {
    console.log('error in "create-token" route:', error);
    return c.json({ message: 'error in "create-token" route:' + error }, 401);
  }
};
