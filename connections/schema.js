const mongoose = require("mongoose");
const Schema = new mongoose.Schema({});
const UserModel = mongoose.model("users", Schema);
const EmailModel = mongoose.model("emails", Schema);
const Model = mongoose.model("blogs", Schema);
exports.Model = Model;
exports.UserModel = UserModel;
exports.EmailModel = EmailModel;
