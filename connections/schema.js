const mongoose = require("mongoose");
const Schema = new mongoose.Schema({});
const Model = mongoose.model("blogs", Schema);
exports.Model = Model;
