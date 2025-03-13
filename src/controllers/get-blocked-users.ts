import { Context } from "hono";
import { db } from "../drizzle/db.js";
import { eq } from "drizzle-orm";
import { blocks, users } from "../drizzle/schema.js";
import { BlockedUserType } from "../../../types/types.js";

export const getBlockedUsers = async (c: Context) => {
  try {
    const { userId } = c.get("tokenPayload");
    const blockedUsers: BlockedUserType[] = await db.query.blocks
      .findMany({
        where: eq(blocks.blockingUserId, userId),
        with: {
          blockedUserId: {
            columns: {
              userId: true,
              nickname: true,
              smallAvatar: true,
            },
          },
        },
      })
      .then((blockedUsers) => {
        return blockedUsers.map((blockedUser) => {
          return {
            userId: blockedUser.blockedUserId.userId,
            smallAvatar: blockedUser.blockedUserId.smallAvatar,
            nickname: blockedUser.blockedUserId.nickname,
          };
        });
      });

    return c.json(blockedUsers, 200);
  } catch (error) {
    console.log('error in "blocked-users" route:', error);
    return c.json({ message: 'error in "blocked-users" route:' + error }, 500);
  }
};
