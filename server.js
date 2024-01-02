const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const Router = require("./connections/routes");
const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(cors()); // Cors policy

/* MongoDB Connection */
mongoose.connect("mongodb://192.168.0.122:27017/aapmorBlogsDb");
// mongoose.connect(process.env.MONGO_ATLAS_CONN_URL);

/* Mongo connection function */
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("connected to database");
});

app.use(Router);
app.listen(3005, () => {
  console.log("server running at 3005");
});

/* Exporting app */
module.exports = app;
