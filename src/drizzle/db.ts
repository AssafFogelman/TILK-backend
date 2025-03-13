import postgres from "postgres";
import "dotenv/config";
import * as schema from "./schema.js";
import { drizzle } from "drizzle-orm/postgres-js";

const queryClient = postgres(process.env.CONNECTION_STRING as string);
//logger = true  - log all the SQL queries
export const db = drizzle(queryClient, { schema, logger: false });
