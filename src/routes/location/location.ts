import { Hono } from "hono";

import { validateToken } from "../../models/authSchemas.js";
import { getKnn } from "../../controllers/get-knn.js";

export const location = new Hono().basePath("/location");

location.post("/", validateToken, getKnn);
