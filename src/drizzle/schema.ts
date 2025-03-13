import { relations, sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  date,
  pgEnum,
  boolean,
  timestamp,
  uniqueIndex,
  doublePrecision,
  primaryKey,
  check,
  index,
  integer,
  bigint,
} from "drizzle-orm/pg-core";

//declaring an enum
export const genderEnum = pgEnum("gender_enum", ["man", "woman", "other"]);

//users
export const users = pgTable("users", {
  userId: uuid("user_id").primaryKey().unique().notNull().defaultRandom(),
  phoneNumber: text("phone_number").notNull().unique(),
  originalAvatars: text("original_avatars")
    .array()
    .notNull()
    .default(sql`ARRAY[]::text[]`), //creates an empty text array by default. it must be populated, but it is not mandatory for the first phase of the registration
  smallAvatar: text("small_avatar"), //it is mandatory , but it is not mandatory for the first phase of the registration
  biography: text("biography"),
  //the template of date has to be: "MM/DD/YYYY" or "YYYY-MM-DD"!
  dateOfBirth: date("date_of_birth"),
  //gender is an enum - man, woman, other
  gender: genderEnum("gender"), //it is mandatory , but it is not mandatory for the first phase of the registration
  //is the user active, a.k.a, has the application on their phone and used it once. if the user did not finish registration, he is still not considered active.
  //he is being activated only once he completes the registration. non-active users are not retrieved in the KNN queries.
  activeUser: boolean("active_user").default(false).notNull(),
  //off-grid: the user has decided to be invisible to users he is not connected to (or requested connection)
  offGrid: boolean("off_grid").default(false).notNull(),
  nickname: text("nickname"), //it is mandatory , but it is not mandatory for the first phase of the registration
  //makes SQL create a timestamp once the record is created
  created: timestamp("created", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
  //is the user currently connected
  currentlyConnected: boolean("currently_connected").default(false).notNull(),
  admin: boolean("admin").default(false).notNull(),
  locationDate: timestamp("location_date", {
    withTimezone: true,
    mode: "date",
  }),
  expoPushToken: text("expo_push_token"),
});
/*
uuid - a long long string for Ids
varchar - 255 char string. changes by use.
text - like varchar. just a better name
integer - a whole number
date - "The DATE type is used for values with a date part but no time part"
timestamp - type Date()
pgTable - how to create a table in postgres
primaryKey - the rows are defined by this column
unique - make sure it is unique
notNull - make sure it's not null
defaultRandom - create a random value

*/

/*
we also added a column named "location" of type "geography". 
we did that through the sql editor in Neon. Because Drizzle couldn't handle it.

This is the sql code line: 
//*ALTER TABLE "users" ADD COLUMN "user_location" geography;

Then we added a GIST index to the user_location column (to make it faster):
//*CREATE INDEX ON users USING gist(user_location);

mind you that you need to create the index BEFORE inserting data.
*/

//tagsUsers
export const tagsUsers = pgTable(
  "tags_users",
  {
    tagName: text("tag_name")
      .notNull()
      .references(() => tags.tagName),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.userId),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.tagName, table.userId] }), //composite primary key
    };
  }
);

//tags  ex. "sea", "JavaScript", "basketball"
export const tags = pgTable(
  "tags",
  {
    //tag_content should be unique and lowercased, in order to make sure the user does not have two tags with the same name.
    tagName: text("tag_name").notNull().primaryKey().unique(),
  },
  (table) => ({
    lowercaseCheck: check(
      "lowercase_check",
      sql`${table.tagName} = lower(${table.tagName})`
    ),
  })
);

//joint table of tag templates and tag categories
export const tagsTagCats = pgTable(
  "tags_tag_cats",
  {
    tagName: text("tag_name")
      .notNull()
      .references(() => tags.tagName),
    tagCategoryId: uuid("tag_category_id")
      .notNull()
      .references(() => tagCategories.tagCategoryId),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.tagCategoryId, table.tagName] }), //composite primary key
    };
  }
);

//tag template categories ex. "sports", "computer science", "90's kid"
export const tagCategories = pgTable("tag_categories", {
  tagCategoryId: uuid("tag_category_id")
    .primaryKey()
    .notNull()
    .unique()
    .defaultRandom(),
  categoryName: text("category_name").notNull().unique(),
});

// connections (friendships)
export const connections = pgTable(
  "connections",
  {
    connectionDate: timestamp("connection_date", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),
    connectedUser1: uuid("connected_user1")
      .notNull()
      .references(() => users.userId),
    connectedUser2: uuid("connected_user2")
      .notNull()
      .references(() => users.userId),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.connectedUser1, table.connectedUser2] }), // composite primary key
      checkDifferentUsers: sql`CHECK (${table.connectedUser1} <> ${table.connectedUser2})`, //a user cannot connect to himself
      checkUniqueDirection: sql`CHECK (${table.connectedUser1} < ${table.connectedUser2})`,
      /*
    A connection of A and B would be stored as (connectedUser1: B, connectedUser2: A)
    A connection request from B to A would also be stored as (connectedUser1: B, connectedUser2: A)
    This is because B's UUID is "greater than" A's UUID.
    That ensures that there's only one way to represent a connection between two users in the database
     */
    };
  }
);

// connection requests
export const connectionRequests = pgTable(
  "connection_requests",
  {
    recipientId: uuid("recipient_id")
      .notNull()
      .references(() => users.userId),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => users.userId),
    requestDate: timestamp("request_date", {
      withTimezone: true,
      mode: "date",
    }).defaultNow(),
    unread: boolean("unread").notNull().default(true),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.recipientId, table.senderId] }), // composite primary key
      checkDifferentUsers: sql`CHECK (${table.recipientId} <> ${table.senderId})`, //a user cannot send a connection request to himself
      checkUniqueDirection: sql`CHECK (${table.recipientId} < ${table.senderId})`,
      /*
      A connection request from A to B would be stored as (recipientId: B, senderId: A)
      A connection request from B to A would also be stored as (recipientId: B, senderId: A)
      This is because B's UUID is "greater than" A's UUID.
      That ensures that there's only one way to represent a connection request between two users in the database
       */
    };
  }
);

//blocks
export const blocks = pgTable(
  "blocks",
  {
    blockId: uuid("block_id").primaryKey().defaultRandom().notNull().unique(),
    blockingUserId: uuid("blocking_user_id")
      .notNull()
      .references(() => users.userId),
    blockedUserId: uuid("blocked_user_id")
      .notNull()
      .references(() => users.userId),
    blockDate: timestamp("block_date", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },

  (table) => {
    return {
      //make sure we don't have duplicate blocks
      checkUniqueBlocks: uniqueIndex("unique_blocks").on(
        table.blockingUserId,
        table.blockedUserId
      ),
      checkDifferentUsers: sql`CHECK (${table.blockingUserId} <> ${table.blockedUserId})`,
      //a user cannot block himself
      //the order of the ids is not important, because if A blocks B, we want to consider that A also blocks B, and B also blocks A
    };
  }
);

//chats
export const chats = pgTable(
  "chats",
  {
    chatId: uuid("chat_id").primaryKey().defaultRandom().unique().notNull(),
    participant1: uuid("participant1")
      .notNull()
      .references(() => users.userId),
    participant2: uuid("participant2")
      .notNull()
      .references(() => users.userId),
    lastMessageDate: timestamp("last_message_date", {
      withTimezone: true,
      mode: "date",
    }),
    lastMessageSender: uuid("last_message_sender").references(
      () => users.userId
    ),
    lastMessageText: text("last_message_text"),
    readByP1: boolean("read_by_p1").default(false).notNull(),
    readByP2: boolean("read_by_p2").default(false).notNull(),
    unreadCountP1: integer("unread_count_p1").default(0).notNull(),
    unreadCountP2: integer("unread_count_p2").default(0).notNull(),
    lastReadMessageP1: uuid("last_read_message_p1"),
    lastReadMessageP2: uuid("last_read_message_p2"),
  },
  (table) => {
    return {
      checkUniqueParticipants: uniqueIndex("unique_participants").on(
        table.participant1,
        table.participant2
      ),
      checkParticipantOrder: sql`CHECK (${table.participant1} <= ${table.participant2})`,
      // This ensures only one record per unique pair of participants,
      // including when a user chats with themselves
      /*
      If User A (ID: 123) and User B (ID: 456) start a chat, it will always be stored as (participant1: 123, participant2: 456).
      Attempts to create another chat record with the same participants (in any order) will fail due to the unique index.
      If User A starts a chat with themselves, it will be stored as (participant1: 123, participant2: 123), and the unique index will prevent duplicates.
      */
    };
  }
);

//chat messages

//we want the search of messages to go this way: each chat message has a chat id.
//that way we can index the chat messages with the chat id field.
//plus, when you just need to fetch all the messages of a certain chat id, it is more efficient
//than to search every message for the existence of two specific chat participants
export const chatMessages = pgTable(
  "chat_messages",
  {
    messageId: uuid("message_id")
      .primaryKey()
      .unique()
      .notNull()
      .defaultRandom(),
    chatId: uuid("chat_id")
      .notNull()
      .references(() => chats.chatId),
    sentDate: timestamp("sent_date", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    receivedDate: timestamp("received_date", {
      withTimezone: true,
      mode: "date",
    }),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => users.userId),
    recipientId: uuid("recipient_id")
      .notNull()
      .references(() => users.userId),
    text: text("text").notNull(),
    unread: boolean("unread").default(true).notNull(),
    //if the message is sent by the user, and then becomes read, that means that the other user read it
    //if the message is sent by the other user, and then becomes read, that means that the user read it
    //and so, when sending a message, it initially is unread, but should still look in the UI as a read sent message.
    gotToServer: bigint("got_to_server", { mode: "number" })
      .notNull()
      .default(0), //new Date().getTime();  // returns number like 1677123456789
    eventId: text("event_id").notNull(), //the receiving userId:gotToServer(in milliseconds).sequence number:0.
  },
  (table) => {
    return {
      /** we are searching for only the messages of some chatId.
       * then we order the messages by the date they were sent or received.
       * That is why we index the "chat_Id" column (as a prefix, meaning first) and then the dates.
       */
      chatMessageIndex: index("chat_message_index").on(
        table.chatId,
        table.sentDate,
        table.receivedDate
      ),
      //this index is used for fetching undelivered messages
      chatMessageIndex2: index("chat_message_index2").on(
        table.recipientId,
        table.eventId
      ),
      eventIdFormat: check(
        "event_id_format",
        sql`${table.eventId} ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}:[0-9]{1}:\d{13}\.\d{3}$'`
      ),
    };
  }
);

export const eventsEnum = pgEnum("events_enum", [
  "MESSAGE",
  "CONNECTION_REQUEST",
  "CONNECTION_APPROVAL",
  "LOOKING_TO_DO_SAME_THINGS",
]);

export const unreadEvents = pgTable(
  "unread_events",
  {
    id: uuid("id").primaryKey().unique().defaultRandom().notNull(),
    userId: uuid("user_id").references(() => users.userId),
    eventType: eventsEnum("events_enum").notNull(),
    chatId: uuid("chat_id").references(() => chats.chatId),
    messageId: uuid("message_id").references(() => chatMessages.messageId),
    receivedDate: timestamp("received_date", {
      withTimezone: true,
      mode: "date",
    }).notNull(), //not defaultNow because the event received date is determined here.
    //the receivedDate is used for distinguishing between events
  },
  (table) => {
    return {
      unreadEventsIndex: index("unread_events_index").on(
        table.userId,
        table.eventType,
        // I've put the chatId before messageId,
        // because we will usually want to delete all the unread messages of a certain chat.
        table.chatId,
        table.messageId
      ),
    };
  }
);

//notification templates
export const notificationTemplates = pgTable("notification_templates", {
  notificationId: uuid("notification_id")
    .primaryKey()
    .notNull()
    .defaultRandom()
    .unique(),
  notificationName: text("notification_name").notNull().unique(),
  content: text("content").notNull(),
});

//event history
export const pastEvents = pgTable("past_events", {
  eventId: uuid("event_id").primaryKey().defaultRandom().notNull().unique(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.userId),
  eventDate: timestamp("event_date", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
  pastEventType: uuid("past_event_type")
    .notNull()
    .references(() => pastEventTypes.pastEventTypeId),
  /*
  so, let's assume a user has blocked another user. a record will be added to the "blocks"
  table. that record will have a "block_id". through this id we can extrapolate data on 
  this event. the field "relevant_table_primary_key" records just that.
  */
  relevantTablePrimaryKey: uuid("relevant_table_primary_key").notNull(),
  //location_as_text is only relevant when storing location history of a user, else it is null
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
});

//declaring an enum for table names
export const tablesEnum = pgEnum("tables_enum", [
  "users",
  "location_records",
  "connections",
  "connection_requests",
  "blocks",
  "chats",
  "chat_messages",
  "tags",
  "tag_categories",
  "notificationTemplates",
]);

export const pastEventTypes = pgTable("past_event_types", {
  pastEventTypeId: uuid("past_event_type_id")
    .primaryKey()
    .notNull()
    .unique()
    .defaultRandom(),
  pastEventTypeName: text("past_event_type_name").notNull().unique(),
  tableAffected: tablesEnum("table_affected").notNull(),
});

export const errorLog = pgTable("error_log", {
  errorId: uuid("error_id").primaryKey().defaultRandom().notNull().unique(),
  timestamp: timestamp("date", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
  userId: uuid("user_id"), //sometimes we will not know what the userId is, if the user hasn't registered yet.
  error: text("error").notNull(),
  info: text("info").notNull(),
});

//************************************************************* */
//************************************************************* */
// RELATIONS
// only needed for Drizzle to know which columns it can associate with which column

export const userRelations = relations(users, ({ many }) => ({
  tagsUsers: many(tagsUsers),
  connections: many(connections),
  connectionRequests: many(connectionRequests),
  blocks: many(blocks),
  chats: many(chats),
  events: many(pastEvents),
}));

export const tagsUsersRelations = relations(tagsUsers, ({ one }) => ({
  user: one(users, {
    fields: [tagsUsers.userId],
    references: [users.userId],
  }),
  tagName: one(tags, {
    fields: [tagsUsers.tagName],
    references: [tags.tagName],
  }),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  tagsUsers: many(tagsUsers),
  tagCategories: many(tagsTagCats),
}));

export const tagOnTagCatRelations = relations(tagsTagCats, ({ one }) => ({
  tagName: one(tags, {
    fields: [tagsTagCats.tagName],
    references: [tags.tagName],
  }),
  tagCategory: one(tagCategories, {
    fields: [tagsTagCats.tagCategoryId],
    references: [tagCategories.tagCategoryId],
  }),
}));

export const tagCategoryRelations = relations(tagCategories, ({ many }) => ({
  tags: many(tags),
}));

export const connectionsRelations = relations(connections, ({ one }) => ({
  connectedUser1: one(users, {
    fields: [connections.connectedUser1],
    references: [users.userId],
  }),
  connectedUser2: one(users, {
    fields: [connections.connectedUser2],
    references: [users.userId],
  }),
}));

export const connectionRequestRelations = relations(
  connectionRequests,
  ({ one }) => ({
    sender: one(users, {
      fields: [connectionRequests.senderId],
      references: [users.userId],
    }),
    recipient: one(users, {
      fields: [connectionRequests.recipientId],
      references: [users.userId],
    }),
  })
);

export const blocksRelations = relations(blocks, ({ one }) => ({
  blockingUserId: one(users, {
    fields: [blocks.blockingUserId],
    references: [users.userId],
  }),
  blockedUserId: one(users, {
    fields: [blocks.blockedUserId],
    references: [users.userId],
  }),
}));

export const chatsRelations = relations(chats, ({ one, many }) => ({
  participant1: one(users, {
    fields: [chats.participant1],
    references: [users.userId],
  }),
  participant2: one(users, {
    fields: [chats.participant2],
    references: [users.userId],
  }),
  messages: many(chatMessages),
}));

export const chatMessageRelations = relations(chatMessages, ({ one }) => ({
  chatId: one(chats, {
    fields: [chatMessages.chatId],
    references: [chats.chatId],
  }),
  //relation name
  sender: one(users, {
    //foreign key
    fields: [chatMessages.senderId],
    //references
    references: [users.userId],
  }),
  recipient: one(users, {
    //foreign key
    fields: [chatMessages.recipientId],
    //references
    references: [users.userId],
  }),
}));

//unread events relations
export const unreadEventsRelations = relations(unreadEvents, ({ one }) => ({
  userId: one(users, {
    fields: [unreadEvents.userId],
    references: [users.userId],
  }),
  chatId: one(chats, {
    fields: [unreadEvents.chatId],
    references: [chats.chatId],
  }),
  messageId: one(chatMessages, {
    fields: [unreadEvents.messageId],
    references: [chatMessages.messageId],
  }),
}));

//past events - the server records things that happen. relations
export const pastEventsRelations = relations(pastEvents, ({ one }) => ({
  eventType: one(pastEventTypes, {
    //this foreign key
    fields: [pastEvents.pastEventType],
    //references
    references: [pastEventTypes.pastEventTypeId],
  }),
}));

export const pastEventTypesRelations = relations(pastEvents, ({ many }) => ({
  events: many(pastEvents),
}));
