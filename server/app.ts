import express from "express";
import http from "http";
import path from "path";
import { Server } from "socket.io";
import mongoose from "mongoose";
import dotenv from "dotenv";
import bodyParser from "body-parser";

import drawingsRoutes from "./routes/drawing";

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server);

const PORT = 5000;

mongoose
  .connect(process.env.MONGO_URI as string)
  .then(() => console.log("MongoDB connected"))
  .catch((error) => {
    console.error(
      "MongoDB connection failed:",
      error
    );
  });

app.use(
  bodyParser.json({
    limit: "10mb",
  })
);

app.use(
  "/api/drawings",
  drawingsRoutes
);

// =============================
// STATIC FILES
// =============================

app.use(
  "/css",
  express.static(
    path.join(__dirname, "public/css")
  )
);

app.use(
  "/js",
  express.static(
    path.join(__dirname, "public/js")
  )
);

// =============================
// ROOM STATE
// =============================

type RoomUser = {
  name: string;
  cursorId: string;
};

const roomUsers: Record<
  string,
  Map<string, RoomUser>
> = {};

const roomAdmins: Record<
  string,
  string
> = {};

// =============================
// CURRENT CANVAS STATE
// =============================
//
// Stores the latest canvas JSON for
// every active/known room.
//
// This allows a user who refreshes,
// leaves and comes back, etc. to receive
// the latest board instead of starting
// with a blank canvas.
//
// It remains in server memory until
// the server restarts.
// =============================

const roomCanvasState: Record<
  string,
  any
> = {};

// =============================
// SOCKET.IO
// =============================

io.on("connection", (socket) => {
  console.log(
    "User connected:",
    socket.id
  );

  // =============================
  // JOIN ROOM
  // =============================

  socket.on(
    "join-room",
    ({
      roomId,
      name,
      isAdmin,
      cursorId,
    }: {
      roomId: string;
      name: string;
      isAdmin: boolean;
      cursorId: string;
    }) => {
      socket.join(roomId);

      socket.data.name = name;
      socket.data.cursorId = cursorId;

      if (!roomUsers[roomId]) {
        roomUsers[roomId] =
          new Map();
      }

      // --------------------------------
      // Check for existing connection
      // with same cursorId.
      //
      // This handles browser refresh.
      // --------------------------------

      for (const [
        existingSocketId,
        existingUser,
      ] of roomUsers[roomId]) {
        if (
          existingUser.cursorId ===
          cursorId
        ) {
          // Remove old cursor from
          // other connected users.
          socket
            .to(roomId)
            .emit(
              "cursor-remove",
              {
                id: cursorId,
              }
            );

          // Remove old socket entry.
          roomUsers[roomId].delete(
            existingSocketId
          );

          // Remove old admin assignment
          // if necessary.
          if (
            roomAdmins[roomId] ===
            existingSocketId
          ) {
            delete roomAdmins[roomId];
          }
        }
      }

      // --------------------------------
      // Add new connection
      // --------------------------------

      roomUsers[roomId].set(
        socket.id,
        {
          name,
          cursorId,
        }
      );

      // --------------------------------
      // Admin
      // --------------------------------

      if (isAdmin) {
        roomAdmins[roomId] =
          socket.id;
      }

      // --------------------------------
      // Send current canvas to the
      // newly connected user.
      //
      // IMPORTANT:
      // This is sent only to this socket.
      // --------------------------------

      socket.emit(
        "canvas-state",
        {
          json:
            roomCanvasState[
              roomId
            ] ?? null,
        }
      );

      // --------------------------------
      // Send updated user list
      // --------------------------------

      io.to(roomId).emit(
        "user-list",
        {
          users: Array.from(
            roomUsers[roomId],
            ([id, user]) => ({
              id,
              name: user.name,
              cursorId:
                user.cursorId,
            })
          ),

          adminId:
            roomAdmins[roomId] ||
            null,
        }
      );
    }
  );

  // =============================
  // CANVAS UPDATE
  // =============================

  socket.on(
    "canvas-update",
    ({
      roomId,
      json,
    }: {
      roomId: string;
      json: any;
    }) => {
      // --------------------------------
      // IMPORTANT:
      // First save the latest canvas
      // on the server.
      // --------------------------------

      roomCanvasState[roomId] =
        json;

      // --------------------------------
      // Then send it to everyone else.
      // --------------------------------

      socket
        .to(roomId)
        .emit(
          "canvas-update",
          {
            json,
          }
        );
    }
  );

  // =============================
  // ADMIN EVENTS
  // =============================

  socket.on(
    "clear",
    ({
      roomId,
    }: {
      roomId: string;
    }) => {
      socket
        .to(roomId)
        .emit("clear");
    }
  );

  socket.on(
    "undo",
    ({
      dataUrl,
      roomId,
    }: {
      dataUrl: string;
      roomId: string;
    }) => {
      socket
        .to(roomId)
        .emit(
          "undo",
          {
            dataUrl,
          }
        );
    }
  );

  socket.on(
    "redo",
    ({
      dataUrl,
      roomId,
    }: {
      dataUrl: string;
      roomId: string;
    }) => {
      socket
        .to(roomId)
        .emit(
          "redo",
          {
            dataUrl,
          }
        );
    }
  );

  // =============================
  // REMOTE CURSOR
  // =============================

  socket.on(
    "mouse-move",
    ({
      roomId,
      id,
      name,
      x,
      y,
    }: {
      roomId: string;
      id: string;
      name: string;
      x: number;
      y: number;
    }) => {
      socket
        .to(roomId)
        .emit(
          "mouse-move",
          {
            id,
            name,
            x,
            y,
          }
        );
    }
  );

  // =============================
  // DISCONNECT
  // =============================

  socket.on("disconnect", () => {
    for (const roomId in roomUsers) {
      const currentUser =
        roomUsers[roomId].get(
          socket.id
        );

      // This socket may already have
      // been removed because the same
      // user refreshed/reconnected.
      if (!currentUser) {
        continue;
      }

      // Remove this user's cursor
      // from other users.
      socket
        .to(roomId)
        .emit(
          "cursor-remove",
          {
            id: currentUser.cursorId,
          }
        );

      // Remove socket
      roomUsers[roomId].delete(
        socket.id
      );

      // Remove admin if necessary
      if (
        roomAdmins[roomId] ===
        socket.id
      ) {
        delete roomAdmins[roomId];
      }

      // Send updated user list
      io.to(roomId).emit(
        "user-list",
        {
          users: Array.from(
            roomUsers[roomId],
            ([id, user]) => ({
              id,
              name: user.name,
              cursorId:
                user.cursorId,
            })
          ),

          adminId:
            roomAdmins[roomId] ||
            null,
        }
      );

      // --------------------------------
      // IMPORTANT:
      // Do NOT delete roomCanvasState.
      //
      // The board should remain available
      // when everybody temporarily leaves
      // and someone comes back.
      // --------------------------------

      if (
        roomUsers[roomId].size ===
        0
      ) {
        delete roomUsers[roomId];
        delete roomAdmins[roomId];
      }
    }

    console.log(
      "User disconnected:",
      socket.id
    );
  });
});

server.listen(PORT, () => {
  console.log(
    `🚀 CollabBoard server running at http://localhost:${PORT}`
  );
});