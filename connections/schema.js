const mongoose = require("mongoose");

const BlogsSchema = new mongoose.Schema({});
const Model = mongoose.model("blogs", BlogsSchema);
exports.Model = Model;
