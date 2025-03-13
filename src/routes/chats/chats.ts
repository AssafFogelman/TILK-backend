import { Hono } from "hono";

import { validateToken } from "../../models/authSchemas.js";
import { getChatMessages } from "../../controllers/get-chat-messages.js";
import { getChatsList } from "../../controllers/get-chats-list.js";
import { addChat } from "../../controllers/add-chat.js";

export const chats = new Hono().basePath("/chats");

//return all chats for the user - perhaps should get only last message of each chat
chats.get("/", validateToken, getChatsList);

//add chat
chats.post("/add-chat", validateToken, addChat);
