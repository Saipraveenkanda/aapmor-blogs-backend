const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const Router = require("./connections/routes");
const setupSocket = require("./socketHandler");
require("dotenv").config(); // In case you're using .env for MONGO_ATLAS_CONN_URL or PORT
const PORT = process.env.PORT || 5000;

const app = express();
const server = http.createServer(app);
const { io, userSocketMap } = setupSocket(server);
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

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`🚀 Server running on ${PORT}`);
  });
}

// Export for usage in other files (optional if already attaching to req)
// module.exports = { app, io, userSocketMap };
module.exports = server;
