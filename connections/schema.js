const mongoose = require("mongoose");
const Schema = new mongoose.Schema({});
const UserModel = mongoose.model("users", Schema);
const EmailModel = mongoose.model("emails", Schema);
const Model = mongoose.model("blogs", Schema);
const winnerSchema = new mongoose.Schema({
  winnerName: { type: String, required: true },
  blogTitle: { type: String, required: true },
  blogLink: { type: String, required: true },
  month: { type: String, required: true },
  blogId: { type: String, required: true },
});

const ReplySchema = new mongoose.Schema({
  name: { type: String, required: true },
  comment: { type: String, required: true },
  dateObject: { type: Date, default: Date.now },
});

const CommentSchema = new mongoose.Schema({
  comment: { type: String, required: true, trim: true },
  name: { type: String, required: true },
  dateObject: { type: Date, default: Date.now },
  likes: { type: [String], default: [] }, // Stores user emails who liked
  replies: { type: [ReplySchema], default: [] }, // Stores nested replies
});

const CommentModel = mongoose.model("Comment", CommentSchema);

const Winner = mongoose.model("Winner", winnerSchema);
exports.Model = Model;
exports.UserModel = UserModel;
exports.EmailModel = EmailModel;
exports.Winner = Winner;
exports.CommentModel = CommentModel;
