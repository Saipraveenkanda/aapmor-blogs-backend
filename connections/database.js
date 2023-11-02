const { MongoClient } = require("mongodb");
const client = new MongoClient(
  "mongodb+srv://aapmorblogs:aapmorblogs@aapmorblogsdb.pyyvcvm.mongodb.net/aapmorBlogsDb"
);

const dataBase = "aapmorBlogsDb";
const collection = "users";

const connection = client.db(dataBase).collection(collection);
const connectionBlogs = client.db(dataBase).collection("blogs");
exports.connection = connection;
exports.connectionBlogs = connectionBlogs;
// module.exports = client;
