// socketHandler.js
const { Server } = require("socket.io");

const userSocketMap = new Map();

function setupSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: true,
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("🟢 Socket connected:", socket.id);

    socket.on("register", (userId) => {
      if (userId) {
        userSocketMap.set(userId.toString(), socket.id);
        console.log(`👤 User ${userId} registered with socket ${socket.id}`);
      }
    });

    socket.on("disconnect", () => {
      console.log("🔴 Socket disconnected:", socket.id);
      for (let [userId, sId] of userSocketMap.entries()) {
        if (sId === socket.id) {
          userSocketMap.delete(userId);
          console.log(`🗑 Removed ${userId} from socket map`);
          break;
        }
      }
    });
  });

  return { io, userSocketMap };
}

module.exports = setupSocket;
