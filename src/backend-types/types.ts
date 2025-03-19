//a copy of react's ErrorInfo type
export type ReactErrorInfoType = {
  componentStack: string;
  digest?: string;
};

//************************** knn data types **************************

export type knnDataItemType = {
  user_id: string;
  nickname: string;
  original_avatars: string[];
  small_avatar: string;
  gender: "man" | "woman" | "other";
  currently_connected: boolean;
  date_of_birth: string;
  biography: string;
  distance: number;
  connected: boolean;
  request_recipient: boolean;
  request_sender: boolean;
  unread: null | true | false;
  tags: string[];
};

export type knnDataType = knnDataItemType[] | null;

//************************** auth Context Types **************************

export const ACTIONS = {
  RESTORE_TOKEN: "RESTORE_TOKEN",
  SIGN_IN: "SIGN_IN",
  SIGN_UP: "SIGN_UP",
  SIGN_OUT: "SIGN_OUT",
  RESET: "RESET",
  AVATAR_WAS_CHOSEN: "AVATAR_WAS_CHOSEN",
  BIO_WAS_CHOSEN: "BIO_WAS_CHOSEN",
  TAGS_WERE_CHOSEN: "TAGS_WERE_CHOSEN",
} as const;

export interface AuthState {
  isLoading: boolean;
  isSignOut: boolean;
  userToken: string | null;
  chosenAvatar: boolean;
  chosenBio: boolean;
  chosenTags: boolean;
  isAdmin: boolean;
  userId: string;
}

export type AuthAction =
  | { type: typeof ACTIONS.RESTORE_TOKEN; data: SignUpType }
  | { type: typeof ACTIONS.SIGN_IN; token: string }
  | { type: typeof ACTIONS.SIGN_OUT }
  | { type: typeof ACTIONS.SIGN_UP; data: SignUpType }
  | { type: typeof ACTIONS.AVATAR_WAS_CHOSEN }
  | { type: typeof ACTIONS.BIO_WAS_CHOSEN }
  | { type: typeof ACTIONS.TAGS_WERE_CHOSEN }
  | { type: typeof ACTIONS.RESET };

export type SignUpType = {
  userId: string;
  chosenAvatar: boolean;
  chosenBio: boolean;
  chosenTags: boolean;
  isAdmin: boolean;
  userToken: string;
};

//************************** connections list types **************************

export type ReceivedRequestsQueryResult = {
  userId: string;
  originalAvatar: string[];
  smallAvatar: string;
  nickname: string;
  currentlyConnected: boolean;
  unread: boolean;
  gender: "man" | "woman" | "other";
  dateOfBirth: string | null;
  biography: string;
}[];

export type ConnectedUsersQueryResult = {
  userId: string;
  originalAvatar: string[];
  smallAvatar: string;
  nickname: string;
  currentlyConnected: boolean;
  gender: "man" | "woman" | "other";
  dateOfBirth: string | null;
  biography: string;
}[];

export type SentRequestsQueryResult = {
  userId: string;
  originalAvatar: string[];
  smallAvatar: string;
  nickname: string;
  currentlyConnected: boolean;
  gender: "man" | "woman" | "other";
  dateOfBirth: string | null;
  biography: string;
}[];

export const ConnectionsCategory = {
  CONNECTION_REQUEST: "CONNECTION_REQUEST",
  CONNECTED_USER: "CONNECTED_USER",
  SENT_REQUEST: "SENT_REQUEST",
} as const;

export type ConnectionsScreenUser = {
  category: keyof typeof ConnectionsCategory;
  userId: string;
  originalAvatar: string[];
  smallAvatar: string;
  nickname: string;
  currentlyConnected: boolean;
  tags: string[];

  lastMessage?: {
    lastMessageText: string | null;
    unread: boolean;
    lastMessageSenderId: string | null;
  } | null;
  unread?: boolean;
  gender: "man" | "woman" | "other";
  dateOfBirth: string | null;
  biography: string;
};

export type ConnectionsListItem = ConnectionsScreenUser;

export type ConnectionsListType = ConnectionsListItem[];

//the buttons that each type of user has:
export const connectionsButtonLabels: Record<
  keyof typeof ConnectionsCategory,
  Record<string, string>[]
> = {
  [ConnectionsCategory.CONNECTION_REQUEST]: [
    { accept: "accept" },
    { decline: "decline" },
  ],
  [ConnectionsCategory.CONNECTED_USER]: [{ chat: "chat" }],
  [ConnectionsCategory.SENT_REQUEST]: [{ cancelRequest: "cancel request" }],
} as const;

//************************** chats types **************************

export type MessageType = {
  messageId: string;
  sentDate: Date;
  receivedDate: Date | null;
  text: string;
  unread: boolean;
  //if the message is sent by the user, and then becomes read, that means that the other user read it
  //if the message is sent by the other user, and then becomes read, that means that the user read it
  //and so, when sending a message, it initially is unread, but should still look in the UI as a read sent message.
  //senderId will tell us who sent the message - the user or the other user
  senderId: string;
  recipientId: string;
  gotToServer: number;
  chatId: string;
};

export type ChatType = {
  chatId: string;
  otherUser: UserType;
  unread: boolean;
  lastMessageDate: string | null;
  lastMessageSender: string | null;
  lastMessageText: string | null;
  unreadCount: number;
  lastReadMessageId: string | null;
};

export type UserType = {
  userId: string;
  nickname: string;
  smallAvatar: string;
  originalAvatar: string;
  biography: string;
};

export type ChatsType = ChatType[];

//************************** tabs types **************************

type IconName =
  | "home"
  | "home-outline"
  | "chat"
  | "chat-outline"
  | "people"
  | "people-outline";

export type Route = {
  key: string;
  title: string;
  focusedIcon: IconName;
  unfocusedIcon: IconName;
};

/*************************************unread events types *************************************/

//all these types are just used to articulate that if
//an event is of type "unread_message", is also positively possesses
//the other related keys such as "messageId".

export const TilkEventType = {
  MESSAGE: "MESSAGE",
  CONNECTION_REQUEST: "CONNECTION_REQUEST",
  CONNECTION_APPROVAL: "CONNECTION_APPROVAL",
  LOOKING_TO_DO_SAME_THINGS: "LOOKING_TO_DO_SAME_THINGS",
} as const;

type BaseEvent = {
  eventId: string;
  recipientId: string;
  otherUserId: string | null;
};

export type AMessageEvent = BaseEvent & {
  eventType: typeof TilkEventType.MESSAGE;
  chatId: string;
  messageId: string;
  text: string;
  sentDate: Date;
  otherUserId: string; //if it is a message, then there must be a sender.
};

//i will later want to add types to other unread events
type OtherEvent = BaseEvent & {
  eventType: Exclude<typeof TilkEventType, typeof TilkEventType.MESSAGE>;
};
//individual events
export type TilkEvent = AMessageEvent | OtherEvent;
//when you want to get all the unread events sorted by event types
export type TilkEvents = Partial<
  Record<keyof typeof TilkEventType, TilkEvent[]>
>;

/********************************* send message types (emit) *********************************/

export type NewEventResponseType = {
  success: boolean;
  messageId?: string;
  gotToServer?: number;
};

export type EmitResponse<T = unknown> = {
  error: Error | null;
  response?: T;
};

export type NewEventPayload = {
  newMessage: MessageType;
  eventType: keyof typeof TilkEventType;
};

export type MessagesReadPayload = {
  chatId: string;
  lastUnreadMessageReceivedDate: string;
};

export type MessagesReadResponseType = {
  success: boolean;
};

export type SetCurrentlyConnectedResponseType = {
  success: boolean;
};

export type SetCurrentlyConnectedPayload = {
  token: string;
};

export type MessageDeliveredResponseType = {
  success: boolean;
};

export type EventDeliveredPayload = {
  receivedDate: Date;
  messageId: string;
  chatId: string;
  eventType: keyof typeof TilkEventType;
};

export type MessageDeliveredPayload = {
  receivedDate: Date;
  messageId: string;
  chatId: string;
};

/************** blocked users types **************/

export type BlockedUserType = {
  userId: string;
  smallAvatar: string | null;
  nickname: string | null;
};
