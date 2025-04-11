const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const Router = require("./connections/routes");

require("dotenv").config(); // In case you're using .env for MONGO_ATLAS_CONN_URL or PORT

const app = express();
const server = http.createServer(app); // Wrap app with HTTP server
const PORT = process.env.PORT || 5000;

// Create a Socket.IO server
const io = new Server(server, {
  cors: {
    origin: "*", // Replace with your frontend URL in production
    methods: ["GET", "POST"],
  },
});

// Use JSON and CORS middleware
app.use(express.json({ limit: "50mb" }));
app.use(cors());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_ATLAS_CONN_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("✅ Connected to MongoDB");
});

// Setup Socket.IO user tracking
const userSocketMap = new Map(); // userId -> socketId

io.on("connection", (socket) => {
  console.log("🟢 Socket connected:", socket.id);

  socket.on("register", (userId) => {
    userSocketMap.set(userId, socket.id);
    console.log(`👤 User ${userId} registered with socket ${socket.id}`);
  });

  socket.on("disconnect", () => {
    console.log("🔴 Socket disconnected:", socket.id);
    for (let [userId, sId] of userSocketMap.entries()) {
      if (sId === socket.id) {
        userSocketMap.delete(userId);
        break;
      }
    }
  });
});

// Add io and userSocketMap to every request (middleware)
app.use((req, res, next) => {
  req.io = io;
  req.userSocketMap = userSocketMap;
  next();
});

// Register your routes
app.use(Router);

// Health check route
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Start the server
server.listen(PORT, () => {
  console.log(`🚀 Server running on ${PORT}`);
});

// Export for usage in other files (optional if already attaching to req)
module.exports = { app, io, userSocketMap };
