const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const Router = require("./connections/routes");
const app = express();
const PORT = process.env.PORT;
app.use(express.json({ limit: "50mb" }));
app.use(cors()); // Cors policy

/* MongoDB Connection */
// mongoose.connect("mongodb://192.168.0.122:27017/aapmorBlogsDb");
mongoose.connect(process.env.MONGO_ATLAS_CONN_URL);

/* Mongo connection function */
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("connected to database");
});

app.use(Router);
app.get("/", (req, res) => {
  res.send("Hello World!");
});
app.listen(PORT, () => {
  console.log(`server running at ${PORT}`);
});

/* Exporting app */
module.exports = app;
