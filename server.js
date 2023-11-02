const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const Router = require("./connections/routes");
const app = express();
app.use(express.json());

app.use(cors());
mongoose.connect(
  "mongodb+srv://aapmorblogs:aapmorblogs@aapmorblogsdb.pyyvcvm.mongodb.net/aapmorBlogsDb"
);
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("connected to database");
});
app.use(Router);

app.listen(3005, () => {
  console.log("server running at 3005");
});

module.exports = app;
