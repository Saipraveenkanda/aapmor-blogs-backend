const { MongoClient } = require("mongodb");
require("dotenv").config();

// const MONGO_LOCAL_CONNECTION = "mongodb://192.168.0.122:27017/";
// const MONGO_ATLAS_CONN_URL ="mongodb+srv://aapmorblogs:aapmorblogs@aapmorblogsdb.pyyvcvm.mongodb.net/aapmorBlogsDb";

// const MONGO_ATLAS_CONN_URL =
//   "mongodb+srv://nexus-360-dev-user:tgaiqVncYpj6vOpz@nexus-360-dev.6tgnxqq.mongodb.net/aapmorBlogsDb";
// console.log(process.env.MONGO_ATLAS_CONN_URL, "MONGOURL");

const client = new MongoClient(process.env.MONGO_ATLAS_CONN_URL);
const dataBase = "aapmorBlogsDb";
const collection = "users";
const connection = client.db(dataBase).collection(collection);
const connectionBlogs = client.db(dataBase).collection("blogs");
const connectionEmail = client.db(dataBase).collection("emails");
exports.connection = connection;
exports.connectionBlogs = connectionBlogs;
exports.connectionEmail = connectionEmail;
