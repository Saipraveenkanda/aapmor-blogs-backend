const { MongoClient } = require("mongodb");
const client = new MongoClient(
  "mongodb+srv://aapmorblogs:aapmorblogs@aapmorblogsdb.pyyvcvm.mongodb.net/"
);

const dataBase = "aapmorBlogsDb";
const collection = "users";

const connection = client.db(dataBase).collection(collection);
exports.connection = connection;
// module.exports = client;
