const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const app = express();
const { put } = require("@vercel/blob");
const { connection, connectionBlogs } = require("./database");
const {
  Model,
  Winner,
  CommentModel,
  PublishModel,
  Notification,
  UserModel,
  Activity,
} = require("./schema");
const { sendEmail } = require("../emailServices/otpService");
const { ObjectId } = require("mongodb");
const { sendBlogsMail } = require("../emailServices/newsletterService");
const multer = require("multer");
const path = require("path");
const { sendCommentMail } = require("../emailServices/notifyCommentMail");
const { summarizeText } = require("./summarizeContent");
const { generateUserBio } = require("./generateAutoBio");
const sendNotification = require("../notificationSender");
const {
  sendWinnerEmail,
  sendCertificateEmail,
} = require("../emailServices/certificateMailService");
app.post("/sendEmail", sendEmail);
app.post("/publishBlog", sendBlogsMail);
app.post("/summarize", summarizeText);
app.post("/generateBio", generateUserBio);

const authenticateToken = (request, response, next) => {
  let jwtToken;
  const authHeader = request.headers["authorization"];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.status(203);
    response.send("Authorization failed");
  } else {
    jwt.verify(jwtToken, "ABPPBH_ST", (error, payload) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        request.email = payload.email;
        next();
      }
    });
  }
};
// Login API

app.post("/api/login", async (request, response) => {
  const { email, otp } = request.body;
  connection.findOne({ email: email }).then(async (resObj) => {
    const otpMatched = await bcrypt.compare(otp, resObj.otp);
    if (otpMatched === true) {
      const {
        email,
        designation,
        gender,
        name,
        isProfileUpdated,
        admin,
        profileImage,
      } = resObj;
      const payload = {
        email,
        designation,
        gender,
        name,
        isProfileUpdated,
        admin,
        profileImage,
      };
      const jwt_token = jwt.sign(payload, "ABPPBH_ST");
      response.status(200).json({ jwt_token, email });
    } else {
      response.status(202);
      response.json({ message: "Invalid OTP" });
    }
  });
});

app.put("/users", async (request, response) => {
  const { updatePassword, email } = request.body;

  const hashedPassword = await bcrypt.hash(updatePassword, 10);
  connection
    .updateOne(
      {
        email: email,
      },
      { $set: { password: hashedPassword } }
    )
    .then((res) => {
      response.send(res);
    })
    .catch((err) => response.send(err));
});

app.get("/blogs", async (request, response) => {
  const blogsArray = await Model.find({}, { html: 0 });
  const blogs = blogsArray.reverse();
  try {
    response.send(blogs);
  } catch (error) {
    response.send(error);
  }
});

/* CREATE NEW BLOG */
app.post("/blogs", authenticateToken, async (request, response) => {
  const {
    title,
    description,
    category,
    blogImage,
    username,
    userrole,
    date,
    likes,
    comments,
    htmlFile,
    savedUsers,
  } = request.body;
  const { email } = request;

  try {
    const user = await UserModel.findOne({ email: email });
    const authorId = new ObjectId(user._id.toString());
    const blogResult = await connectionBlogs.insertOne({
      title,
      description,
      category,
      blogImage,
      username,
      userrole,
      date,
      likes,
      comments,
      html: htmlFile,
      savedUsers,
      email,
      authorId,
    });

    const blogId = blogResult.insertedId;

    await connection.updateOne(
      { email: email },
      { $push: { createdBlogs: blogId } }
    );

    response.status(200).json({ message: blogId });
  } catch (err) {
    response.status(500).send(err);
  }
});

/* UPDATE EXISTING BLOG */
app.put("/blogs/:id", authenticateToken, async (request, response) => {
  const blogId = request.params.id;
  const updatedData = request.body;
  try {
    const updateResult = await connectionBlogs.updateOne(
      { _id: new ObjectId(blogId) },
      { $set: updatedData }
    );

    if (updateResult.matchedCount === 0) {
      return response.status(404).json({ message: "Blog not found" });
    }

    response.status(200).json({ message: "Blog updated successfully" });
  } catch (err) {
    response.status(500).send(err);
  }
});

/* DELETE BLOG */
app.delete("/blogs/:id", authenticateToken, async (request, response) => {
  const blogId = request.params.id;
  const { email } = request;

  try {
    // 1. Delete from blogs collection
    const deleteResult = await connectionBlogs.deleteOne({
      _id: new ObjectId(blogId),
    });

    if (deleteResult.deletedCount === 0) {
      return response.status(404).json({ message: "Blog not found" });
    }

    // 2. Remove blog reference from user
    await connection.updateOne(
      { email: email },
      { $pull: { createdBlogs: new ObjectId(blogId) } }
    );

    // 3. Remove from winners collection if exists
    await Winner.deleteOne({ blogId: new ObjectId(blogId) });

    response.status(200).json({ message: "Blog deleted successfully" });
  } catch (err) {
    console.error("Error deleting blog:", err);
    response.status(500).send(err);
  }
});

//category Api

app.get("/blogs/filter", async (request, response) => {
  const { category = "All" } = request.query;
  if (category === "All") {
    var query = Model.find({}, { html: 0 });
  } else {
    var query = Model.find({ category: category }, { html: 0 });
  }
  const blogsByCategory = await query;
  const reversedBlogs = blogsByCategory.reverse();
  try {
    response.send(reversedBlogs);
  } catch (error) {
    response.send(error);
  }
});

//blog view comp
app.get("/blogs/:id", (request, response) => {
  const { id } = request.params;
  connectionBlogs
    .findOne({ _id: new ObjectId(id) })
    .then((res) => {
      if (res) {
        if (res.comments && Array.isArray(res.comments)) {
          res.comments = [...res.comments].reverse();
        }
        response.send(res);
      } else {
        response.status(500).send({});
      }
    })
    .catch((err) => console.log(err));
});

// ADD COMMENTS TO BLOG API
app.post("/comments", authenticateToken, async (request, response) => {
  const io = request.io;
  const userSocketMap = request.userSocketMap;
  const { email } = request;
  const { comment, id, name, dateObject } = request.body;
  const blog = await connectionBlogs.findOne({ _id: new ObjectId(id) });

  connectionBlogs
    .findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $push: { comments: { comment, name, dateObject } } },
      { upsert: true, new: true }
    )
    .then(async (res) => {
      if (!res) {
        console.log("⚠️ No blog found after comment update");
        return response.status(404).json({ error: "Blog not found" });
      }

      const blogOwnerId = res.authorId?.toString();
      await sendNotification({
        io,
        userSocketMap,
        userId: blogOwnerId,
        type: "comment",
        blogId: res._id,
        from: { name, email },
        message: `${name} commented on your blog - ${blog.title}`,
        comment: comment,
        broadcastMessage: `${name} commented on ${res.username}'s blog`,
      });

      response.status(200).json({ message: "new comment added" });
    })
    .catch((err) => {
      console.error("❌ Error in comment update:", err);
      response.status(500).json({ error: "Internal server error" });
    });

  await sendCommentMail(blog, comment, id);
});

// UPDATE PROFILE DETAIL
// app.post("/profile", (request, response) => {
//   const { designation, gender, name, email, isProfileUpdated } = request.body;
//   connection
//     .updateOne(
//       { email: email },
//       {
//         $set: {
//           name: name,
//           designation: designation,
//           gender: gender,
//           isProfileUpdated: isProfileUpdated,
//         },
//       }
//     )
//     .then(async (res) => {
//       const profile = await connection.findOne({ email: email });
//       console.log(profile, "PROFILE");
//       response.status(200).json({
//         message: "Thank you, profile details updated successfully!",
//         profile,
//       });
//     })
//     .catch((err) => response.send(err));
// });
app.post("/profile", authenticateToken, async (request, response) => {
  try {
    const { name, designation, gender, profileImage, bio, isProfileUpdated } =
      request.body;
    const { email } = request;
    if (!email) {
      return response.status(400).json({ message: "Unauthorized" });
    }
    // Construct update object dynamically
    const updateFields = {};
    if (name) updateFields.name = name;
    if (designation) updateFields.designation = designation;
    if (gender) updateFields.gender = gender;
    if (profileImage) updateFields.profileImage = profileImage;
    if (bio) updateFields.bio = bio;
    if (isProfileUpdated !== undefined)
      updateFields.isProfileUpdated = isProfileUpdated;

    // Update only provided fields
    const result = await connection.updateOne(
      { email: email },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return response.status(404).json({ message: "User not found" });
    }

    // Fetch updated profile
    const profile = await connection.findOne({ email: email });

    response.status(200).json({
      message: "Profile updated successfully!",
      profile,
    });
  } catch (error) {
    response.status(500).json({ message: "An error occurred", error });
  }
});

app.get("/profile/check", authenticateToken, (request, response) => {
  const { email } = request;
  connection.findOne({ email: email }).then((res) => {
    if (res?.isProfileUpdated === true) {
      response.status(200);
      response.json({ message: "Profile already updated", res });
    } else {
      response.status(202).json({ message: "Not Updated Yet" });
    }
  });
});

// app.put("/likes", authenticateToken, async (request, response) => {
//   const { id, name } = request.body;
//   const { email } = request;
//   const likeObject = {
//     name,
//     email,
//     time: new Date(),
//   };

//   if (!id) {
//     return response.status(400).json({ error: "Blog ID is required." });
//   }

//   try {
//     const blog = await connectionBlogs.findOne({ _id: new ObjectId(id) });
//     if (!blog) {
//       return response.status(404).json({ error: "Blog not found." });
//     }
//     const userLiked = blog.likes?.some((like) => like.email === email);

//     const updateQuery = userLiked
//       ? { $pull: { likes: { name } } }
//       : { $addToSet: { likes: likeObject } };

//     const updatedBlog = await connectionBlogs.findOneAndUpdate(
//       { _id: new ObjectId(id) },
//       updateQuery,
//       { returnDocument: "after" }
//     );

//     response.json({
//       success: true,
//       message: userLiked ? "Unliked successfully" : "Liked successfully",
//       likes: updatedBlog.likes,
//     });
//   } catch (error) {
//     response
//       .status(500)
//       .json({ error: "Something went wrong", details: error });
//   }
// });

// SAVE BLOGS API

app.put("/likes", authenticateToken, async (request, response) => {
  const io = request.io;
  const userSocketMap = request.userSocketMap;
  const { id, name } = request.body;
  const { email } = request;
  const likeObject = {
    name,
    email,
    time: new Date(),
  };
  if (!id) {
    return response.status(400).json({ error: "Blog ID is required." });
  }

  try {
    const blog = await connectionBlogs.findOne({ _id: new ObjectId(id) });
    if (!blog) {
      return response.status(404).json({ error: "Blog not found." });
    }

    const userLiked = blog.likes?.some((like) => like.email === email);
    if (userLiked) {
      // Unlike (remove like)
      const updatedBlog = await connectionBlogs.findOneAndUpdate(
        { _id: new ObjectId(id), "likes.email": email }, // Ensure the user actually liked it
        { $pull: { likes: { email } } }, // Remove like by email
        { returnDocument: "after" }
      );

      return response.json({
        success: true,
        message: "Unliked successfully",
        likes: updatedBlog.likes,
      });
    } else {
      // Like (add only if not already liked)
      const updatedBlog = await connectionBlogs.findOneAndUpdate(
        { _id: new ObjectId(id), "likes.email": { $ne: email } }, // Ensure user hasn't liked
        { $push: { likes: likeObject } }, // Add like
        { new: true }
      );

      if (!updatedBlog) {
        return response.json({
          success: false,
          message: "Already liked, ignoring duplicate request",
        });
      }
      // 🔔 Emit real-time notification only if blog owner is online
      const blogOwnerId = updatedBlog.authorId?.toString();
      const socketId = userSocketMap.get(blogOwnerId);
      if (!socketId) {
        console.warn(`No socket ID found for blog owner ${blogOwnerId}`);
      }

      await sendNotification({
        io,
        userSocketMap,
        userId: blogOwnerId,
        type: "like",
        blogId: updatedBlog?.authorId,
        from: { name, email },
        message: `${name} liked your blog - ${updatedBlog.title}`,
        broadcastMessage: `${name} liked ${updatedBlog.username}'s blog.`,
      });

      return response.json({
        success: true,
        message: "Liked successfully",
        likes: updatedBlog.likes,
      });
    }
  } catch (error) {
    response
      .status(500)
      .json({ error: "Something went wrong", details: error });
  }
});

app.post("/saveblog", authenticateToken, async (request, response) => {
  const { _id } = request.body;
  const { email } = request;

  await connectionBlogs
    .findOneAndUpdate(
      { _id: new ObjectId(_id) },
      { $push: { savedUsers: email } },
      { $upsert: true },
      { new: true }
    )
    .then((res) => {
      response.status(200).send({ flag: "success" });
    })
    .catch((err) => response.send(err));
});

//REMOVE SAVED BLOG
app.put("/saveblog", authenticateToken, async (request, response) => {
  const { _id } = request.body;
  const { email } = request;

  await connectionBlogs
    .findOneAndUpdate(
      { _id: new ObjectId(_id) },
      { $pull: { savedUsers: email } }
    )
    .then((res) => {
      response.status(200).send({ flag: "success" });
    })
    .catch((err) => response.send(err));
});

//GET ALL SAVED BLOGS OF USER API
app.get("/usersaved", authenticateToken, async (request, response) => {
  const { email } = request;
  const savedBlogsArray = await Model.find({}, { html: 0 });
  let blogs = [];
  savedBlogsArray.findIndex((each, index) => {
    if (each._doc.savedUsers.includes(email)) {
      blogs.push(savedBlogsArray[index]);
    }
  });
  response.status(200).send(blogs);
});

/* Save thumbnail and profile pic to blob storage */

const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png|webp|gif/;
    const extName = fileTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimeType = fileTypes.test(file.mimetype);

    if (extName && mimeType) {
      return cb(null, true);
    } else {
      cb(new Error("Only images are allowed"));
    }
  },
});

/* BLOG THUMBNAIL */
app.post(
  "/post/blogthumb",
  authenticateToken,
  upload.single("image"),
  async (request, response) => {
    const uploadUrl = process.env.UPLOAD_URL;
    const writeToken = process.env.BLOB_READ_WRITE_TOKEN;

    try {
      const file = request.file;

      if (!file) {
        throw new Error("File not found in the request.");
      }

      const filename = "test"; // Adjust this to use a dynamic filename if needed
      const blob = await put(filename, file.buffer, {
        access: "public",
        contentType: file.mimetype,
      });

      const { url } = blob; // Adjust based on the response format from `put`
      return response.status(200).json({ url });
    } catch (error) {
      console.error("Error uploading image:", error);
      response.status(500).json({ error: error.message });
    }
  }
);

/* PROFILE IMAGE UPLOAD */
app.post(
  "/upload/profile-image",
  authenticateToken,
  upload.single("image"),
  async (request, response) => {
    try {
      const file = request.file;
      if (!file) {
        return response.status(400).json({ message: "No file uploaded." });
      }

      const { email } = request;
      if (!email) {
        return response.status(400).json({ message: "Unauthorized" });
      }

      // Upload to Vercel Blob
      const filename = `profile_${Date.now()}`; // Unique filename
      const blob = await put(filename, file.buffer, {
        access: "public",
        contentType: file.mimetype,
      });

      const { url } = blob;

      // Update user collection with profile image URL
      const result = await connection.updateOne(
        { email: email },
        { $set: { profileImage: url } }
      );

      if (result.matchedCount === 0) {
        return response.status(404).json({ message: "User not found." });
      }

      // Fetch updated profile
      const profile = await connection.findOne({ email: email });

      response.status(200).json({
        message: "Profile image uploaded successfully!",
        profile,
      });
    } catch (error) {
      console.error("Error uploading profile image:", error);
      response
        .status(500)
        .json({ message: "Image upload failed.", error: error.message });
    }
  }
);

// app.post("/api/winners", authenticateToken, async (req, res) => {
//   const { email } = req;
//   const { blogId } = req.body;
//   console.log(req.body, "WINNER BODY");
//   const user = await connection.findOne({ email: email });
//   if (user?.admin === true) {
//     try {
//       const winner = new Winner(req.body);
//       await winner.save();
//       await connectionBlogs.updateOne(
//         { _id: new ObjectId(blogId) },
//         { $set: { isBestBlog: true } }
//       );
//       res.status(201).json({ message: "Winner saved successfully!" });
//     } catch (error) {
//       res.status(500).json({ error: "Error saving winner" });
//     }
//   } else {
//     res.status(403).json({ error: "No admin rights to perfrom this action" });
//   }
// });
app.post("/api/winners", authenticateToken, async (req, res) => {
  const { email } = req;
  const { blogId, winnerName, blogTitle, month, date } = req.body;
  console.log(req.body, "WINNER BODY");

  try {
    const user = await connection.findOne({ email });
    if (!user?.admin) {
      return res
        .status(403)
        .json({ error: "No admin rights to perform this action" });
    }

    // Check if winner already exists
    const existingWinner = await Winner.findOne({ blogId });

    if (!existingWinner) {
      const winner = new Winner(req.body);
      await winner.save();
      await connectionBlogs.updateOne(
        { _id: new ObjectId(blogId) },
        { $set: { isBestBlog: true } }
      );
      // await sendWinnerEmail(email, winnerName, blogTitle, month);
      await sendWinnerEmail(
        req?.body?.email,
        winnerName,
        blogTitle,
        month,
        date
      );
      return res
        .status(201)
        .json({ message: "Winner announced successfully!" });
    } else {
      await Winner.deleteOne({ blogId });
      await connectionBlogs.updateOne(
        { _id: new ObjectId(blogId) },
        { $set: { isBestBlog: false } }
      );

      return res.status(200).json({ message: "Winner reverted successfully!" });
    }
  } catch (error) {
    console.error("Error in /api/winners:", error);
    res.status(500).json({ error: "Error processing winner action" });
  }
});

// app.get("/api/winners/current", async (req, res) => {
//   try {
//     const currentMonth = new Intl.DateTimeFormat("en-US", {
//       month: "long",
//     }).format(new Date(new Date().setMonth(new Date().getMonth() - 1)));

//     const winner = await Winner.find({ month: currentMonth }).sort({
//       _id: -1,
//     });

//     if (winner.length === 0) {
//       return res
//         .status(200)
//         .json({ message: "No winner found for this month." });
//     }

//     res.json(winner);
//   } catch (error) {
//     res.status(500).json({ error: "Error fetching winner of the month" });
//   }
// });
app.get("/api/winners", async (req, res) => {
  try {
    const monthsToFetch = parseInt(req.query.months) || 3;
    const now = new Date();
    const monthYearPairs = [];
    for (let i = 0; i < monthsToFetch; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = new Intl.DateTimeFormat("en-US", { month: "long" }).format(
        date
      );
      monthYearPairs.push(month);
    }
    // Fetch winners for the last N months
    const winners = await Winner.find({
      month: { $in: monthYearPairs },
    }).sort({ _id: -1 });
    if (!winners || winners.length === 0) {
      return res.status(200).json({ message: "No winners found." });
    }
    res.json(winners);
  } catch (error) {
    console.error("Error fetching winners:", error);
    res.status(500).json({ error: "Error fetching winners." });
  }
});

app.get("/api/publishblogs/aapmor", async (req, res) => {
  try {
    const blogs = await PublishModel.find({});
    if (blogs.length > 0) {
      res.status(200).json({ data: blogs });
    } else {
      res.status(200).json({ data: [] });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error fetching blogs of the month" });
  }
});
app.post("/api/publishblogs/aapmor", async (req, res) => {
  const body = req.body;
  const { blogId } = body;
  console.log(blogId);
  try {
    const blog = await PublishModel.create(body);
    await connectionBlogs.updateOne(
      { _id: new ObjectId(blogId) },
      { $set: { publishedToWeb: true } }
    );
    res.status(200).json({ data: "Blog Published to Aapmor", blog });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error publishing blog" });
  }
});
app.delete("/api/publishblogs/aapmor/:blogId", async (req, res) => {
  const { blogId } = req.params;
  console.log(blogId, "BLOG ID");
  try {
    await PublishModel.deleteOne({ blogId: blogId });
    await connectionBlogs.updateOne(
      { _id: new ObjectId(blogId) },
      { $set: { publishedToWeb: false } }
    );
    res.status(200).json({ data: "Blog Un Published to Aapmor" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error un publishing blog" });
  }
});

app.get("/author/:email", authenticateToken, async (req, res) => {
  try {
    const { email } = req.params;
    // Fetch only required fields
    const author = await connection.findOne(
      { email }
      // "name email bio image followers articles"
    );

    if (!author) {
      return res.status(404).json({ message: "Author not found" });
    }

    res.status(200).json({
      name: author.name,
      email: author.email,
      bio: author.bio || "This author loves sharing insightful thoughts.",
      image: author.profileImage || "", // Empty if no profile image
      // followers: author.followers || 0,
      articles: author?.createdBlogs?.length || 0,
    });
  } catch (error) {
    console.error("Error fetching author details:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post("/comments/like", authenticateToken, async (request, response) => {
  try {
    const { blogId, commentIndex } = request.body;
    const { email } = request;

    if (!blogId || commentIndex === undefined) {
      return response.status(400).json({ error: "Missing required fields" });
    }

    const blog = await connectionBlogs.findOne({ _id: new ObjectId(blogId) });

    if (!blog) return response.status(404).json({ error: "Blog not found" });

    if (!blog.comments || blog.comments.length <= commentIndex) {
      return response.status(404).json({ error: "Comment not found" });
    }

    // Ensure the comment has a 'likes' array
    if (!blog.comments[commentIndex].likes) {
      blog.comments[commentIndex].likes = [];
    }

    // Check if user already liked it
    const alreadyLiked = blog.comments[commentIndex].likes.includes(email);

    if (alreadyLiked) {
      // Unlike (Remove user from likes)
      blog.comments[commentIndex].likes = blog.comments[
        commentIndex
      ].likes.filter((id) => email !== email);
    } else {
      // Like (Add user to likes)
      blog.comments[commentIndex].likes.push(email);
    }

    // Update the specific comment inside the array
    const updatedBlog = await connectionBlogs.findOneAndUpdate(
      { _id: new ObjectId(blogId) },
      {
        $set: {
          [`comments.${commentIndex}.likes`]: blog.comments[commentIndex].likes,
        },
      },
      { returnDocument: "after" }
    );

    response.status(200).json({
      message: "Comment liked/unliked successfully",
      likes: updatedBlog.comments[commentIndex].likes,
    });
  } catch (error) {
    console.error("Error liking comment:", error);
    response.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/comments/reply", authenticateToken, async (req, res) => {
  try {
    const { blogId, commentIndex, replyText, name } = req.body;

    if (!blogId || commentIndex === undefined || !replyText || !name) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Create reply object
    const reply = {
      _id: new ObjectId(),
      name,
      comment: replyText,
      dateObject: new Date(),
    };

    // Find the blog and check if the comment exists
    const blog = await connectionBlogs.findOne(
      { _id: new ObjectId(blogId) },
      { projection: { [`comments.${commentIndex}.replies`]: 1 } }
    );

    if (!blog) return res.status(404).json({ error: "Blog not found" });

    const comment = blog.comments[commentIndex];

    if (!comment) return res.status(404).json({ error: "Comment not found" });

    // Update the comment to add a reply
    const updateAction = {
      $push: { [`comments.${commentIndex}.replies`]: reply },
    };

    const result = await connectionBlogs.updateOne(
      { _id: new ObjectId(blogId) },
      updateAction
    );

    if (result.modifiedCount === 0) {
      return res.status(400).json({ error: "Reply operation failed" });
    }

    res.status(200).json({ message: "Reply added", reply });
  } catch (error) {
    console.error("Error adding reply:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get top liked blogs grouped by month (current + previous month)
// app.get("/top-liked-blogs", async (req, res) => {
//   try {
//     const monthsToFetch = parseInt(req.query.months) || 2; // Optional query param
//     // const Model = mongoose.model("blogs"); // use your existing model

//     // Calculate date from which to fetch blogs (start of N months ago)
//     const startDate = new Date();
//     startDate.setMonth(startDate.getMonth() - (monthsToFetch - 1));
//     startDate.setDate(1); // Start from the first day of that month

//     const blogs = await Model.aggregate(
//       [
//         {
//           $addFields: {
//             parsedDate: { $toDate: "$date" }, // Convert string to Date
//           },
//         },
//         {
//           $match: {
//             parsedDate: { $gte: startDate },
//             "likes.0": { $exists: true },
//           },
//         },
//         {
//           $addFields: {
//             year: { $year: "$parsedDate" },
//             month: { $month: "$parsedDate" },
//             likesCount: { $size: "$likes" },
//           },
//         },
//         {
//           $sort: { year: -1, month: -1, likesCount: -1 },
//         },
//         {
//           $group: {
//             _id: { year: "$year", month: "$month" },
//             topBlogs: { $push: "$$ROOT" },
//           },
//         },
//         {
//           $project: {
//             _id: 0,
//             year: "$_id.year",
//             month: "$_id.month",
//             topBlogs: {
//               $map: {
//                 input: { $slice: ["$topBlogs", 5] },
//                 as: "blog",
//                 in: {
//                   _id: "$$blog._id",
//                   title: "$$blog.title",
//                   description: "$$blog.description",
//                   category: "$$blog.category",
//                   blogImage: "$$blog.blogImage",
//                   username: "$$blog.username",
//                   userrole: "$$blog.userrole",
//                   date: "$$blog.date",
//                   likes: "$$blog.likes",
//                   comments: "$$blog.comments",
//                   savedUsers: "$$blog.savedUsers",
//                   email: "$$blog.email",
//                   publishedToWeb: "$$blog.publishedToWeb",
//                   // html field is excluded
//                 },
//               },
//             },
//           },
//         },
//         {
//           $sort: { year: -1, month: -1 },
//         },
//       ],
//       {
//         allowDiskUse: true,
//       }
//     );
//     res.status(200).json(blogs);
//   } catch (error) {
//     console.error("Error fetching top liked blogs:", error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// });
app.get("/top-liked-blogs", async (req, res) => {
  try {
    const monthsToFetch = parseInt(req.query.months) || 2;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - (monthsToFetch - 1));
    startDate.setDate(1);

    const blogs = await Model.aggregate(
      [
        {
          $project: {
            title: 1,
            description: 1,
            category: 1,
            blogImage: 1,
            username: 1,
            userrole: 1,
            date: 1,
            likes: 1,
            comments: 1,
            savedUsers: 1,
            email: 1,
            publishedToWeb: 1,
          },
        },
        {
          $addFields: {
            parsedDate: { $toDate: "$date" },
          },
        },
        {
          $match: {
            parsedDate: { $gte: startDate },
            "likes.0": { $exists: true },
          },
        },
        {
          $addFields: {
            year: { $year: "$parsedDate" },
            month: { $month: "$parsedDate" },
            likesCount: { $size: "$likes" },
          },
        },
        {
          $sort: { year: -1, month: -1, likesCount: -1 },
        },
        {
          $group: {
            _id: { year: "$year", month: "$month" },
            topBlogs: { $push: "$$ROOT" },
          },
        },
        {
          $project: {
            _id: 0,
            year: "$_id.year",
            month: "$_id.month",
            topBlogs: { $slice: ["$topBlogs", 5] },
          },
        },
        {
          $sort: { year: -1, month: -1 },
        },
      ],
      {
        allowDiskUse: true, // ✅ This is the fix for memory overflow
      }
    );
    res.status(200).json(blogs);
  } catch (error) {
    console.error("Error fetching top liked blogs:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/notifications", authenticateToken, async (req, res) => {
  try {
    console.log(req.email);
    const user = await UserModel.findOne({ email: req.email });
    const authorId = user._id;
    const notifications = await Notification.find({ recipient: authorId })
      .sort({ timestamp: -1 })
      .limit(50);
    // console.log(notifications);
    res.json({ notifications });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

app.delete("/notifications/:userId", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    await Notification.deleteMany({ recipient: userId });
    res.status(200).json({ message: "Notifications cleared" });
  } catch (error) {
    console.error("Clear notification error", error);
    res.status(500).json({ error: "Failed to clear notifications" });
  }
});

app.get("/api/activity", async (req, res) => {
  try {
    const activities = await Activity.find({});
    if (activities.length > 0) {
      res.status(200).json({ data: activities.reverse() });
    } else {
      res.status(200).json({ data: [] });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error fetching activities" });
  }
});

module.exports = app;
