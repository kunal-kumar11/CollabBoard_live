const express = require("express");
const http = require("http");
const path = require("path");
const socketIO = require("socket.io");
const mongoose = require("mongoose");
const drawingsRoutes = require("./rotues/drawing");
const bodyParser = require("body-parser");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = 5000;

require('dotenv').config()

mongoose.connect(process.env.MONGO_URI).then(() => console.log("MongoDB connected"));

app.use(bodyParser.json({ limit: "10mb" }));

app.use("/api/drawings", drawingsRoutes);

// Serve only CSS and JS files statically from /public
app.use("/css", express.static(path.join(__dirname, "public/css")));
app.use("/js", express.static(path.join(__dirname, "public/js")));


app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

// Serve whiteboard page
app.get("/whiteboard", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "whiteboard.html"));
});


const roomUsers = {};    // Map of socket.id => name
const roomAdmins = {};   // Map of roomId => adminSocketId
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

socket.on("join-room", ({ roomId, name, isAdmin }) => {
  socket.join(roomId);
  socket.data.name = name;

  if (!roomUsers[roomId]) {
    roomUsers[roomId] = new Map();
  }
  roomUsers[roomId].set(socket.id, name);

  // Store admin ID if it's the admin
  if (isAdmin) {
    roomAdmins[roomId] = socket.id;
  }

  // Emit updated user list with adminId
  io.to(roomId).emit("user-list", {
    users: Array.from(roomUsers[roomId], ([id, name]) => ({ id, name })),
    adminId: roomAdmins[roomId] || null
  });
});

  // Real-time draw events
socket.on("canvas-update", ({ roomId, json }) => {
  socket.to(roomId).emit("canvas-update", { json });
});

  // Admin-only events
  socket.on("clear", ({ roomId }) => {
    socket.to(roomId).emit("clear");
  });

  socket.on("undo", ({ dataUrl, roomId }) => {
    socket.to(roomId).emit("undo", { dataUrl });
  });

  socket.on("redo", ({ dataUrl, roomId }) => {
    socket.to(roomId).emit("redo", { dataUrl });
  });
     //Backend Snippet  
  socket.on("mouse-move", ({ roomId, name, x, y }) => {
    socket.to(roomId).emit("mouse-move", { name, x, y });
  });
  
  // Disconnect handler
  socket.on("disconnect", () => {
    for (let roomId in roomUsers) {
      if (roomUsers[roomId].has(socket.id)) {
        roomUsers[roomId].delete(socket.id);
        io.to(roomId).emit("user-list", {
          users: Array.from(roomUsers[roomId], ([id, name]) => ({ id, name })),
        });
      }
    }
    console.log("User disconnected:", socket.id);
  });
});

server.listen(PORT, () =>
  console.log(`🚀 CollabBoard server running at http://localhost:${PORT}`)
);

