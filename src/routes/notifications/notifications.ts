import { Hono } from "hono";

import { validateToken } from "../../models/authSchemas.js";
import { getUnreadEvents } from "../../controllers/get-unread-events.js";

export const notifications = new Hono().basePath("/notifications");

//return all unread events for a user
notifications.get("/unread-events", validateToken, getUnreadEvents);
