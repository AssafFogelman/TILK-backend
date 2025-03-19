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
};
export const ConnectionsCategory = {
    CONNECTION_REQUEST: "CONNECTION_REQUEST",
    CONNECTED_USER: "CONNECTED_USER",
    SENT_REQUEST: "SENT_REQUEST",
};
//the buttons that each type of user has:
export const connectionsButtonLabels = {
    [ConnectionsCategory.CONNECTION_REQUEST]: [
        { accept: "accept" },
        { decline: "decline" },
    ],
    [ConnectionsCategory.CONNECTED_USER]: [{ chat: "chat" }],
    [ConnectionsCategory.SENT_REQUEST]: [{ cancelRequest: "cancel request" }],
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
};
