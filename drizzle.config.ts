//drizzle definitions
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  //the schema file:
  schema: "./src/drizzle/schema.ts",
  //the migrations will be saved to this folder:
  out: "./src/drizzle/migrations",
  //using postgres (not sqlite or my sql)
  driver: "pg",
  //the connection string to the database
  dbCredentials: {
    connectionString: process.env.CONNECTION_STRING as string,
  },
  //tell me exactly what changes in the database when we make a migration
  verbose: true,
  //ask me if I'm sure I want to change things
  strict: true,
});
