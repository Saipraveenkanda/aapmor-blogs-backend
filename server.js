const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const Router = require("./apiCodes");
const app = express();
app.use(express.json());

app.use(cors());
mongoose.connect("mongodb://localhost:27017/Blogsdata");
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("connected");
});
app.use(Router);
app.listen(3005, () => {
  console.log("server running at 3005");
});

module.exports = app;
