import { Context } from "hono";
import { db } from "../drizzle/db.js";
import { eq } from "drizzle-orm";
import { users } from "../drizzle/schema.js";
import * as fs from "fs/promises";
import path from "path";
import sharp from "sharp";

/* 
1. gets the files from the form data
2. filters the array to only full cells
3. makes a small version of the first photo (which is the chosen avatar) for use
4. saves the files
5. uploads the paths to the database
6. returns "success" of "failure"

 dir tree:
    public
│   └── avatars
│       ├── default
│       │   └── default-avatar.png
│       ├── original
│       │   └── [user_id]
│       │       └── avatar-${i}-large.webp.webp
│       └── thumbnails
│           ├── small
│           │   └── [user_id].webp
│           └── medium
│               └── [user_id].webp

 */

const maxFiles = 8;
const largeAvatarRoot = path.join(
  process.cwd(),
  "public",
  "avatars",
  "original"
);
const smallAvatarRoot = path.join(
  process.cwd(),
  "public",
  "avatars",
  "thumbnails",
  "small"
);
const tempDirectoryRoot = path.join(process.cwd(), "public", "temp");
const errorTooManyFiles = {
  message: "tried to upload too many files at once!",
};
const errorRoute = { message: 'error in "post-avatars" route:' };

export const postAvatars = async (c: Context) => {
  try {
    const { userId } = c.get("tokenPayload");

    type FileType = {
      content: string;
      type: string;
      name: string;
    };

    type AvatarType = null | string | FileType;

    type Request = { avatars: AvatarType[] };

    const { avatars } = (await c.req.json()) as Request;

    if (avatars.length > maxFiles) {
      throw errorTooManyFiles;
    }

    if (!avatars.length) {
      throw { message: "no file was sent!" };
    }

    if (!avatars[0]) {
      throw { message: "user hasn't selected a main avatar! only secondary!" };
    }

    console.log(
      "Received data:",
      avatars.map(
        (avatar: AvatarType) => JSON.stringify(avatar).substring(0, 100) + "..."
      )
    ); // Log a preview of the received data

    const largeAvatarDirectory = path.join(largeAvatarRoot, userId);
    const smallAvatarDirectory = path.join(smallAvatarRoot, userId);
    const tempDirectory = path.join(tempDirectoryRoot, userId);

    // Create directory if it doesn't exist
    await fs.mkdir(largeAvatarDirectory, { recursive: true });
    await fs.mkdir(smallAvatarDirectory, { recursive: true });
    await fs.mkdir(tempDirectory, { recursive: true });

    //empty user temp directory
    await emptyDirectory(tempDirectory);
    //empty user's thumbnail avatar's directory
    await emptyDirectory(smallAvatarDirectory);

    //create a copy of all the avatar files in the new order in the temp directory
    const originalAvatarTempPaths = (
      await Promise.all(
        avatars.map(async (avatar: AvatarType, index: number) => {
          if (!avatar) return null;
          const fileName = `avatar-${index}-large-${new Date().getTime()}.webp`;
          const tempFilePath = path.join(tempDirectory, fileName);

          //does the avatar path refer to a file that already exists?
          if (typeof avatar === "string") {
            //change the sent-in path (that starts with "http") to a proper file path
            const serverFilePath =
              process.cwd() + "/public" + avatar.split("public")[1];
            //if the file was deleted from the server, return null (we will need to later update the DB)
            console.log("server file path:", serverFilePath);
            if (!(await checkFileExists(serverFilePath))) {
              return null;
            }
            await fs.rename(serverFilePath, tempFilePath);
            return tempFilePath;
          }

          //is the file an image?
          if (!avatar.type.startsWith("image/")) return null;

          // Decode the Base64 content
          const buffer = Buffer.from(avatar.content, "base64");

          // Convert the image to WebP who's maximum size is 1000 X 1000 px
          const webpBuffer = await sharp(buffer)
            .webp()
            .resize({
              width: 1000,
              height: 1000,
              fit: "inside",
              withoutEnlargement: true,
            })
            .toBuffer();

          // Write the file
          await fs.writeFile(tempFilePath, webpBuffer);

          //return large file info
          return tempFilePath;
        })
      )
    ).filter((path): path is string => path !== null);

    //create a small copy of the first avatar

    // Get the path of the first avatar
    const imageBuffer = await fs.readFile(originalAvatarTempPaths[0]);
    const smallWebpBuffer = await sharp(imageBuffer)
      .webp()
      .resize({ width: 80, height: 80, fit: "inside" })
      .toBuffer();
    const smallAvatarName = `${userId}-${new Date().getTime()}.webp`;
    const smallAvatarFullPath = path.join(
      smallAvatarDirectory,
      smallAvatarName
    );
    await fs.writeFile(smallAvatarFullPath, smallWebpBuffer);
    const smallAvatarPath = smallAvatarFullPath;

    console.log("originalAvatarTempPaths:", originalAvatarTempPaths);

    //move the original size avatars from the temporary dir to the avatar dir
    await emptyDirectory(largeAvatarDirectory);
    const finalAvatarPaths = await Promise.all(
      originalAvatarTempPaths.map(async (filePath) => {
        const fileName = path.basename(filePath);
        const destinationPath = path.join(largeAvatarDirectory, fileName);
        await fs.rename(filePath, destinationPath);
        return destinationPath;
      })
    );

    //create paths that have no beginnings
    const dbPathsOriginal = finalAvatarPaths.map((path) =>
      ("/public" + path.split("public")[1]).split("\\").join("/")
    );
    const dbPathsSmall = ("/public" + smallAvatarPath.split("public")[1])
      .split("\\")
      .join("/");

    //update the database
    await db
      .update(users)
      .set({
        originalAvatars: dbPathsOriginal,
        smallAvatar: dbPathsSmall,
      })
      .where(eq(users.userId, userId));

    return c.json(
      { originalSize: [...dbPathsOriginal], smallSize: dbPathsSmall },
      200
    );
  } catch (error) {
    console.log('error in "post-avatars" route:', error);
    return c.json({ ...errorRoute, error }, 401);
  }
};

async function renameFile(oldPath: string, newPath: string) {
  try {
    await fs.rename(oldPath, newPath);
    console.log(`File renamed from ${oldPath} to ${newPath}`);
  } catch (error) {
    console.error("Error renaming file:", error);
  }
}

async function moveFile(sourcePath: string, destinationPath: string) {
  try {
    // Ensure the destination directory exists
    await fs.mkdir(path.dirname(destinationPath), { recursive: true });

    // Move the file
    await fs.rename(sourcePath, destinationPath);
    console.log(
      `File moved successfully from ${sourcePath} to ${destinationPath}`
    );
  } catch (error) {
    console.error("Error moving file:", error);
  }
}

async function checkFileExists(path: string) {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

async function emptyDirectory(directory: string) {
  try {
    const files = await fs.readdir(directory);
    for (const file of files) {
      const filePath = path.join(directory, file);
      const stat = await fs.stat(filePath);

      if (stat.isDirectory()) {
        await emptyDirectory(filePath);
        await fs.rmdir(filePath);
      } else {
        await fs.unlink(filePath);
      }
    }
    console.log(`All contents in ${directory} have been removed.`);
  } catch (error) {
    console.error("Error emptying directory:", error);
  }
}
