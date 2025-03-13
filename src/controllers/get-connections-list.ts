import { Context } from "hono";
import { db } from "../drizzle/db.js";
import { and, eq, or, not, inArray, isNull, sql, desc } from "drizzle-orm";
import {
  connections,
  users,
  connectionRequests,
  blocks,
  tagsUsers,
  tags,
  chats,
} from "../drizzle/schema.js";
import {
  ConnectionsListType,
  ReceivedRequestsQueryResult,
  ConnectedUsersQueryResult,
  SentRequestsQueryResult,
} from "../../../types/types.js";
import ConnectionsCategory from "../backend-types/ConnectionsCategory.js";

/*
  get user connections, received connections requests,and sent connections requests

*/

export const getConnectionsList = async (c: Context) => {
  try {
    const { userId }: { userId: string } = c.get("tokenPayload");

    // Get received connection requests
    const receivedRequests = (await db
      .select({
        userId: users.userId,
        smallAvatar: users.smallAvatar,
        originalAvatar: users.originalAvatars,
        nickname: users.nickname,
        currentlyConnected: users.currentlyConnected,
        unread: connectionRequests.unread,
        gender: users.gender,
        dateOfBirth: users.dateOfBirth,
        biography: users.biography,
      })
      .from(connectionRequests)
      .innerJoin(users, eq(users.userId, connectionRequests.senderId))
      .leftJoin(
        blocks,
        or(
          and(
            eq(blocks.blockingUserId, userId),
            eq(blocks.blockedUserId, users.userId)
          ),
          and(
            eq(blocks.blockingUserId, users.userId),
            eq(blocks.blockedUserId, userId)
          )
        )
      )
      .where(
        and(
          eq(connectionRequests.recipientId, userId),
          // user isn't blocked or blocking
          isNull(blocks.blockId),
          // user must be active
          eq(users.activeUser, true),
          // user must have a small avatar, nickname, biography, and gender
          // BTW, they can't be null since they are mandatory when the user registers.
          // so if you have performance issues, you can remove the not(isNull())s
          not(isNull(users.smallAvatar)),
          not(isNull(users.nickname)),
          not(isNull(users.gender)),
          not(isNull(users.biography))
        )
      )
      .orderBy(
        desc(connectionRequests.requestDate)
      )) as ReceivedRequestsQueryResult;

    // Get connected users
    const connectedUsers = (await db
      .select({
        userId: users.userId,
        smallAvatar: users.smallAvatar,
        originalAvatar: users.originalAvatars,
        nickname: users.nickname,
        currentlyConnected: users.currentlyConnected,
        gender: users.gender,
        dateOfBirth: users.dateOfBirth,
        biography: users.biography,
      })
      .from(connections)
      .innerJoin(
        users,
        or(
          eq(connections.connectedUser1, users.userId),
          eq(connections.connectedUser2, users.userId)
        )
      )
      .leftJoin(
        blocks,
        or(
          and(
            eq(blocks.blockingUserId, userId),
            eq(blocks.blockedUserId, users.userId)
          ),
          and(
            eq(blocks.blockingUserId, users.userId),
            eq(blocks.blockedUserId, userId)
          )
        )
      )
      .where(
        and(
          // user is connected to the current user
          or(
            eq(connections.connectedUser1, userId),
            eq(connections.connectedUser2, userId)
          ),
          //user isn't the requesting user
          not(eq(users.userId, userId)),
          // user isn't blocked or blocking
          isNull(blocks.blockId),
          // user must be active
          eq(users.activeUser, true),
          // user must have a small avatar, nickname, biography, and gender
          // BTW, they can't be null since they are mandatory when the user registers.
          // so if you have performance issues, you can remove the not(isNull())s
          not(isNull(users.smallAvatar)),
          not(isNull(users.nickname)),
          not(isNull(users.gender)),
          not(isNull(users.biography))
        )
      )
      .orderBy(desc(connections.connectionDate))) as ConnectedUsersQueryResult;

    // Get sent connection requests
    const sentRequests = (await db
      .select({
        userId: users.userId,
        smallAvatar: users.smallAvatar,
        originalAvatar: users.originalAvatars,
        nickname: users.nickname,
        currentlyConnected: users.currentlyConnected,
        gender: users.gender,
        dateOfBirth: users.dateOfBirth,
        biography: users.biography,
      })
      .from(connectionRequests)
      .innerJoin(users, eq(users.userId, connectionRequests.recipientId))
      .leftJoin(
        blocks,
        or(
          and(
            eq(blocks.blockingUserId, userId),
            eq(blocks.blockedUserId, users.userId)
          ),
          and(
            eq(blocks.blockingUserId, users.userId),
            eq(blocks.blockedUserId, userId)
          )
        )
      )
      .where(
        and(
          eq(connectionRequests.senderId, userId),
          //user isn't blocked or blocking
          isNull(blocks.blockId),
          //retrieve user as long as they are not off-grid
          eq(users.offGrid, false),
          // user must be active
          eq(users.activeUser, true),
          // user must have a small avatar, nickname, biography, and gender
          // BTW, they can't be null since they are mandatory when the user registers.
          // so if you have performance issues, you can remove the not(isNull())s
          not(isNull(users.smallAvatar)),
          not(isNull(users.nickname)),
          not(isNull(users.gender)),
          not(isNull(users.biography))
        )
      )
      .orderBy(
        desc(connectionRequests.requestDate)
      )) as SentRequestsQueryResult;

    //extract all other-users' ids
    const userIds = [
      ...receivedRequests,
      ...connectedUsers,
      ...sentRequests,
    ].map((u) => u.userId);

    // Get tags for all users
    const userTags =
      userIds.length > 0
        ? await db
            .select({ userId: tagsUsers.userId, tagName: tags.tagName })
            .from(tagsUsers)
            .innerJoin(tags, eq(tags.tagName, tagsUsers.tagName))
            .where(inArray(tagsUsers.userId, userIds))
        : [];

    // Get last messages of chats. Intended for connected users only.
    const lastMessages = await db
      .select({
        otherUserId: sql`CASE 
          WHEN ${chats.participant1} = ${userId} THEN ${chats.participant2}
          ELSE ${chats.participant1}
        END`.as("otherUserId"),
        lastMessageSender: chats.lastMessageSender,
        lastMessageText: chats.lastMessageText,
        unread: sql<boolean>`CASE 
        WHEN ${chats.participant1} = ${userId} THEN ${!chats.readByP1}
        ELSE ${!chats.readByP2}
      END`.as("unread"),
      })
      .from(chats)
      .where(
        or(eq(chats.participant1, userId), eq(chats.participant2, userId))
      );

    // a Map for quick lookup of last messages
    const lastMessagesMap = new Map(
      lastMessages.map((msg) => [
        //key is the other user's id
        msg.otherUserId,
        //value is the last message object
        {
          lastMessageSenderId: msg.lastMessageSender ?? null,
          lastMessageText: msg.lastMessageText ?? null,
          unread: msg.unread,
        },
      ])
    );

    // Combine all data
    const data: ConnectionsListType = [
      ...receivedRequests.map((request) => ({
        ...request,
        category: ConnectionsCategory.CONNECTION_REQUEST,
        tags: userTags
          .filter((t) => t.userId === request.userId)
          .map((t) => t.tagName),
      })),

      ...connectedUsers.map((connectedUser) => ({
        ...connectedUser,
        category: ConnectionsCategory.CONNECTED_USER,
        tags: userTags
          .filter((t) => t.userId === connectedUser.userId)
          .map((t) => t.tagName),

        lastMessage: lastMessagesMap.get(connectedUser.userId) ?? null, //if there is no last message, return null
      })),

      ...sentRequests.map((request) => ({
        ...request,
        category: ConnectionsCategory.SENT_REQUEST,
        tags: userTags
          .filter((t) => t.userId === request.userId)
          .map((t) => t.tagName),
      })),
    ];

    return c.json(data, 200);
  } catch (error) {
    console.log('error in "get-connections-list" route:', error);
    return c.json(
      { message: 'error in "get-connections-list" route:' + error },
      401
    );
  }
};
