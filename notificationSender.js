// utils/notificationSender.js

const { Notification, UserModel, Activity } = require("./connections/schema");

async function sendNotification({
  io,
  userSocketMap,
  userId,
  type,
  blogId,
  from,
  message,
  comment,
  broadcastMessage,
}) {
  const socketId = userSocketMap.get(userId);
  // Send direct notification if user is connected
  const user = await UserModel.findOne(
    { email: from?.email },
    { profileImage: 1 }
  ).lean();
  if (socketId) {
    io.to(socketId).emit("notification", {
      type,
      blogId,
      sender: { ...from, profileImage: user?.profileImage },
      message: message,
      comment,
      timestamp: new Date(),
    });
  }

  io.sockets.sockets.forEach((socket, sid) => {
    if (sid !== userSocketMap.get(userId?.toString())) {
      socket.emit("recent-activity", {
        type,
        blogId,
        sender: { ...from, profileImage: user?.profileImage },
        message: broadcastMessage,
        comment,
        timestamp: new Date(),
      });
    }
  });

  await Notification.create({
    type: type,
    blogId: blogId,
    recipient: userId,
    sender: {
      name: from?.name,
      email: from?.email,
      profileImage: user?.profileImage,
    },
    message: message,
    comment,
    timestamp: new Date(),
    read: false,
  });
  if (broadcastMessage) {
    await Activity.create({
      type: type,
      blogId: blogId,
      sender: {
        name: from?.name,
        email: from?.email,
        profileImage: user?.profileImage,
      },
      message: broadcastMessage,
      timestamp: new Date(),
    });
  }
}

module.exports = sendNotification;
