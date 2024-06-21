const { MongoClient } = require("mongodb");

// const MONGO_LOCAL_CONNECTION = "mongodb://192.168.0.122:27017/";
const MONGO_ATLAS_CONN_URL =
  "mongodb+srv://aapmorblogs:aapmorblogs@aapmorblogsdb.pyyvcvm.mongodb.net/aapmorBlogsDb";

// const client = new MongoClient(MONGO_LOCAL_CONNECTION);
const client = new MongoClient(MONGO_ATLAS_CONN_URL);

const dataBase = "aapmorBlogsDb";
const collection = "users";

const connection = client.db(dataBase).collection(collection);
const connectionBlogs = client.db(dataBase).collection("blogs");
const connectionEmail = client.db(dataBase).collection("emails");
exports.connection = connection;
exports.connectionBlogs = connectionBlogs;
exports.connectionEmail = connectionEmail;
