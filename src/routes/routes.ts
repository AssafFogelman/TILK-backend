import { Hono } from "hono";
import { auth } from "./auth/auth.js";
import { user } from "./user/user.js";
import { location } from "./location/location.js";
import { errors } from "./errors/errors.js";
import { chats } from "./chats/chats.js";
import { messages } from "./messages/messages.js";
import { notifications } from "./notifications/notifications.js";

export const routes = new Hono();

routes.route("/", auth); //Handle route "auth"
routes.route("/", user); //Handle route "user"
routes.route("/", location); //Handle route "auth"
routes.route("/", errors); //Handle route "error-log"
routes.route("/", chats); //Handle route "chats"
routes.route("/", messages); //Handle route "messages"
routes.route("/", notifications); //Handle route "notifications"

// routes.route("/", admin); //Handle route "admin"
