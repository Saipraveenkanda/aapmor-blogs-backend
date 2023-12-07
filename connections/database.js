const { MongoClient } = require("mongodb");
require("dotenv").config();

const client = new MongoClient(process.env.MONGODB_URL || "mongodb://192.168.0.122:27017/aapmorBlogsDb");
// "mongodb://192.168.0.122:27017/aapmorBlogsDb" ||
const dataBase = "aapmorBlogsDb";
const collection = "users";

const connection = client.db(dataBase).collection(collection);
const connectionBlogs = client.db(dataBase).collection("blogs");

const connectionEmail = client.db(dataBase).collection("emails");
exports.connection = connection;
exports.connectionBlogs = connectionBlogs;
exports.connectionEmail = connectionEmail;

// module.exports = client;
