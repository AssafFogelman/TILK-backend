import { Hono } from "hono";

import { validateToken } from "../../models/authSchemas.js";
import { getChatMessages } from "../../controllers/get-chat-messages.js";

export const messages = new Hono().basePath("/messages");

//return all messages for a chat
messages.get("/:chatId", validateToken, getChatMessages);
