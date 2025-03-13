import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { prettyJSON } from "hono/pretty-json";
import { secureHeaders } from "hono/secure-headers";
import { logger } from "hono/logger";
import { serveStatic } from "@hono/node-server/serve-static";
import { cors } from "hono/cors";
import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import { routes } from "./routes/routes.js";
import "dotenv/config";
import { db } from "./drizzle/db.js";
import { users } from "./drizzle/schema.js";
import * as os from "node:os";
import { setCurrentlyConnected } from "./APIs/websocket/set-currently-connected.js";
import { registerAsUnconnected } from "./APIs/websocket/register-as-unconnected.js";
import { onNewEvent } from "./APIs/websocket/on-new-event-server.js";
import { onMessagesRead } from "./APIs/websocket/on-message-read-server.js";
import { eventDelivered } from "./APIs/websocket/on-event-delivered-server.js";
import process from "node:process";

// ignore "punycode deprecated" warnings that come from "expo-server-sdk" since they are irrelevant.
ignorePunycode();

//"strict: false" means that "api/" and "api" will reach the same end-point

const app = new Hono({ strict: false });

/* Pretty JSON middleware enables "JSON pretty print" for JSON response body.
  Adding
  "?pretty"
  to url query param, the JSON strings are prettified. */
//ex. GET /?pretty
app.use(prettyJSON());
//like "helmet".
//conflicts with poweredBy() middleware (adds a header: "X-Powered-By": "Hono").
//But I frankly don't care
app.use(secureHeaders());
//logger - console logs all the actions
app.use("*", logger());

// enable cors if we are not in production mode
app.use(
  "*",
  cors({ origin: process.env.NODE_ENV === "production" ? "*" : "" })
);

app.route("/", routes); // Handle routes

//setting a static (public) directory
app.use("/public/*", serveStatic({ root: "./" }));

//setting up the server listener to the port
const port = 5000;
const serverIP = getServerIP();

const httpServer = serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`Server is running on: http://${serverIP}:${info.port}`);
  }
);

//websocket
//http://192.168.1.116:5000/ws/
export const io = new Server(httpServer as HttpServer, {
  path: "/ws/",
  serveClient: true,
  cors: {
    origin: process.env.NODE_ENV === "production" ? false : "*",
  },
  //if the user disconnects abruptly, save his data (state) for 10 minutes
  connectionStateRecovery: {
    // the backup duration of the sessions and the packets
    maxDisconnectionDuration: 10 * 60 * 1000,
    // whether to skip middlewares upon successful recovery
    skipMiddlewares: true,
  },
});

io.on("error", (err) => console.error("websocket error: ", err));
io.engine.on("connection_error", (err) => {
  console.error("WebSocket connection error:", err);
});
io.on("connection", async (socket) => {
  console.log(`new client connected to websocket!!`);

  //set as "currently connected" + deliver undelivered events
  socket.on("setCurrentlyConnected", setCurrentlyConnected);
  //client sent an event to the server
  socket.on("newEvent", onNewEvent);
  //client confirmed that the event was delivered
  socket.on("eventDelivered", eventDelivered);
  //client confirmed that he read the message while he was in the chat
  socket.on("messagesRead", onMessagesRead);
  //client exited the chat and the chatsList and unreadEvents queries should be updated
  socket.on("disconnect", registerAsUnconnected);

  socket.on("error", (error) => {
    console.error(`Socket ${socket.id} error:`, error);
  });
});

//on server startup, if address is already in use (last session did not close properly), restart the session
httpServer.on("error", (e) => {
  if (e.code === "EADDRINUSE") {
    console.log("Address in use, retrying...");
    setTimeout(() => {
      httpServer.close();
      httpServer.listen(port);
    }, 1000);
  }
});

//Graceful shutdown - mark all users as currently not connected + close the websocket and server
process.on("SIGTERM", () => gracefulShutdown(httpServer));

process.on("SIGINT", () => gracefulShutdown(httpServer));

async function gracefulShutdown(httpServer: any) {
  try {
    console.log("Signal received: closing HTTP server");

    //at server shutdown, we want to make sure that no user is set to "currently connected"
    await setNoUserIsCurrentlyConnected();

    // Close socket.io server
    const socketClosePromise = new Promise((resolve) => {
      io.close(() => {
        console.log("Socket.io server closed");
        resolve(true);
      });
    });
    // Close http server
    const httpClosePromise = new Promise((resolve) => {
      httpServer.close(() => {
        console.log("HTTP server closed");
        resolve(true);
      });
    });
    // Wait for both to close with a timeout
    await Promise.race([
      Promise.all([socketClosePromise, httpClosePromise]),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Shutdown timeout")), 5000)
      ),
    ]);
    //close the node process with exit code 0 (success)
    process.exit(0);
  } catch (error) {
    console.error("Error during shutdown:", error);
    //close the node process with exit code 1 (error)
    process.exit(1);
  }
}

//at server shutdown, we want to make sure that no user is set to "currently connected"
async function setNoUserIsCurrentlyConnected() {
  try {
    await db.update(users).set({ currentlyConnected: false });
  } catch (error) {
    console.log(
      "an error occurred while trying to reset the currently connected field of all the users: "
    );
    console.log(error);
  }
}

//get the server's IP address
function getServerIP() {
  const networkInterfaces = os.networkInterfaces();
  for (const interfaceName in networkInterfaces) {
    const someInterface = networkInterfaces[interfaceName];
    if (someInterface === undefined) break;
    for (const entry of someInterface) {
      if (entry.family === "IPv4" && !entry.internal) {
        return entry.address;
      }
    }
  }
  return "127.0.0.1"; // Fallback to localhost if no suitable IP is found
}

function ignorePunycode() {
  process.removeAllListeners("warning");

  process.on("warning", (warning) => {
    if (
      warning.name === "DeprecationWarning" &&
      warning.message.includes("punycode")
    ) {
      return;
    }
    console.warn(warning);
  });
}
