
"use strict";

const { WebSocketServer } = require("ws");
const express = require("express");
const path = require("path");

const app = express();
const port = process.env.PORT || 8080; // Use PORT from .env or default to 8080

// Serve static files (images) from the public/images folder
app.use("/images", express.static(path.join(__dirname, "public/images")));


// Start Express server
const server = app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

// WebSocket server attached to the Express server
const wss = new WebSocketServer({ server });

let allSocket = [];

wss.on("connection", (socket) => {
  socket.on("message", (message) => {
    const parsedMessage = JSON.parse(message.toString());

    if (parsedMessage.type === "join") {
      const { roomId, username, dp } = parsedMessage.payload;
      allSocket.push({
        socket,
        room: roomId,
        username,
        dp,
      });
      console.log(`User ${username} joined room ${roomId} with DP: ${dp}`);
    }

    if (parsedMessage.type === "chat") {
      let currentRoom = null;
      let senderUsername = null;
      let senderDp = null;

      for (let i = 0; i < allSocket.length; i++) {
        if (allSocket[i].socket === socket) {
          currentRoom = allSocket[i].room;
          senderUsername = allSocket[i].username;
          senderDp = allSocket[i].dp;
          break;
        }
      }

      if (currentRoom && senderUsername && senderDp) {
        allSocket.forEach((user) => {
          if (user.room === currentRoom && user.socket !== socket) {
            user.socket.send(
              JSON.stringify({
                text: parsedMessage.payload.message,
                username: senderUsername,
                dp: senderDp,
              })
            );
          }
        });
      }
    }
  });

  socket.on("close", () => {
    allSocket = allSocket.filter((user) => user.socket !== socket);
    console.log("A user disconnected.");
  });
});

console.log(`WebSocket server running on ws://localhost:${port}`);