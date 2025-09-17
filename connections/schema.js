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
  blogImage: { type: String, required: false },
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

const publishToAapmor = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  blogImage: { type: String, required: true },
  username: { type: String, required: true },
  userrole: { type: String, required: true },
  date: { type: String, required: true },
  likes: { type: Array, required: true },
  comments: { type: Array, required: true },
  email: { type: String, required: true },
  publishedDate: { type: Date, default: Date.now },
  blogId: { type: String, required: true },
});

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["like", "comment", "reply", "follow", "system"],
    required: true,
  },
  blogId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Blog", // optional ref to the blogs collection
    required: false,
  },
  recipient: {
    type: String, // email of the blog owner or user who should receive it
    required: true,
  },
  sender: {
    name: String,
    email: String,
    profileImage: String,
  },
  message: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  read: {
    type: Boolean,
    default: false,
  },
});

const activitySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["like", "comment", "reply", "follow", "system"],
    required: true,
  },
  blogId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Blog",
    required: false,
  },
  sender: {
    name: String,
    email: String,
    profileImage: String,
  },
  message: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const Notification = mongoose.model("Notification", notificationSchema);
const CommentModel = mongoose.model("Comment", CommentSchema);
const PublishModel = mongoose.model("publishedblogs", publishToAapmor);
const Activity = mongoose.model("activities", activitySchema);

const Winner = mongoose.model("Winner", winnerSchema);
exports.Model = Model;
exports.UserModel = UserModel;
exports.EmailModel = EmailModel;
exports.Winner = Winner;
exports.CommentModel = CommentModel;
exports.PublishModel = PublishModel;
exports.Notification = Notification;
exports.Activity = Activity;
