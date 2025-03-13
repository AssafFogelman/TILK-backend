import { Hono } from "hono";

import { logError } from "../../controllers/log-error.js";

export const errors = new Hono().basePath("/errors");

errors.post("/", logError);
