import {Context} from "hono";
import {db} from "../drizzle/db";
import {eq} from "drizzle-orm";
import {users} from "../drizzle/schema";
import fs from "fs/promises";
import path from "path";

export const avatarLinks = async (c: Context) => {
    try {
        const {userId} = c.get("tokenPayload");
        const avatarLinks = await db.query.users.findFirst({
            where: eq(users.userId, userId),
            columns: {originalAvatars: true, smallAvatar: true},
        });

        if (!avatarLinks) {
            console.log("avatarLinks doesnt exist. Error at the Database or the schema")
            return c.json({message: "avatarLinks doesnt exist. Error at the Database or the schema"});
        }

        //if the file doesn't exist on the server, return null
        avatarLinks.originalAvatars.map(async (avatarPath) => {
            const filePath = process.cwd() + avatarPath;
            if (!await checkFileExists(avatarPath)) return null;

        })
        if (avatarLinks && avatarLinks.smallAvatar) {
            const smallAvatarPath = process.cwd() + avatarLinks.smallAvatar;
            if (!await checkFileExists(smallAvatarPath)) avatarLinks.smallAvatar = null;
        }


        return c.json(avatarLinks, 200);


    } catch (error) {
        console.log('error in "avatar-links" route:', error);
        return c.json({message: 'error in "avatar-links" route:' + error}, 401);
    }
};


async function checkFileExists(path: string) {
    try {
        await fs.access(path);
        return true;
    } catch {
        return false;
    }
}