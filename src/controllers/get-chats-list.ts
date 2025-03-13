import { eq, or, desc, and, not, exists } from "drizzle-orm";
import { Context } from "hono";
import { chats, blocks } from "../drizzle/schema.js";
import { db } from "../drizzle/db.js";
import { ChatType, UserType } from "../../../types/types.js";

//get the chats list
export async function getChatsList(c: Context) {
  try {
    const { userId } = c.get("tokenPayload");

    const chatsList = await db.query.chats.findMany({
      where: and(
        or(eq(chats.participant1, userId), eq(chats.participant2, userId)),
        not(
          exists(
            db
              .select()
              .from(blocks)
              .where(
                and(
                  eq(blocks.blockingUserId, userId),
                  or(
                    eq(blocks.blockedUserId, chats.participant1),
                    eq(blocks.blockedUserId, chats.participant2)
                  )
                )
              )
          )
        )
      ),
      with: {
        participant1: {
          columns: {
            userId: true,
            nickname: true,
            smallAvatar: true,
            originalAvatars: true,
            biography: true,
          },
        },
        participant2: {
          columns: {
            userId: true,
            nickname: true,
            smallAvatar: true,
            originalAvatars: true,
            biography: true,
          },
        },
      },
      orderBy: desc(chats.lastMessageDate),
    });

    //make sure that the other user has a nickname and a small avatar
    const filteredChatsList = chatsList.filter(
      (chat) =>
        chat.participant1.nickname &&
        chat.participant2.nickname &&
        chat.participant1.smallAvatar &&
        chat.participant2.smallAvatar &&
        chat.participant1.biography &&
        chat.participant2.biography
    );

    // Transform to match ChatType
    const formattedChats: ChatType[] = filteredChatsList.map((chat) => {
      const otherUser: UserType =
        chat.participant1.userId === userId
          ? {
              userId: chat.participant2.userId,
              // nickname, biography and smallAvatar are not null because of the filter
              nickname: chat.participant2.nickname!,
              smallAvatar: chat.participant2.smallAvatar!,
              originalAvatar: chat.participant2.originalAvatars[0],
              biography: chat.participant2.biography!,
            }
          : {
              userId: chat.participant1.userId,
              // nickname, biography and smallAvatar are not null because of the filter
              nickname: chat.participant1.nickname!,
              smallAvatar: chat.participant1.smallAvatar!,
              originalAvatar: chat.participant1.originalAvatars[0],
              biography: chat.participant1.biography!,
            };

      return {
        otherUser,
        ...(chat.participant1.userId === userId
          ? {
              unread: !chat.readByP1,
              unreadCount: chat.unreadCountP1,
            }
          : {
              unread: !chat.readByP2,
              unreadCount: chat.unreadCountP2,
            }),
        lastMessageDate: chat.lastMessageDate?.toISOString() ?? null,
        chatId: chat.chatId,
        lastMessageSender: chat.lastMessageSender,
        lastMessageText: chat.lastMessageText,
        lastReadMessageId: chat.lastReadMessageP1,
      };
    });

    return c.json({ chats: formattedChats });
  } catch (error) {
    console.log("error getting chats list: ", error);
    return c.json({ message: "Error getting chats list", error }, 401);
  }
}
