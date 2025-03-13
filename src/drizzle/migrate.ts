import {drizzle} from "drizzle-orm/postgres-js";
import {migrate} from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import "dotenv/config";
import path from "path";
import {fileURLToPath} from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// defining our migration client
const migrationClient = postgres(process.env.CONNECTION_STRING as string, {
    max: 1,
});

const migrateAsync = async () => {
    try {
        // migrate
        await migrate(drizzle(migrationClient), {
            migrationsFolder: __dirname + "/migrations",
        });
        //end database connection
        await migrationClient.end();
    } catch (error) {
        console.log("there was a problem migration to the database:", error);
    }
};

await migrateAsync();
