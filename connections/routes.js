const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const app = express();
const { put } = require("@vercel/blob");
const { connection, connectionBlogs } = require("./database");
const { Model } = require("./schema");
const { sendEmail } = require("../emailServices/otpService");
const { ObjectId } = require("mongodb");
const { sendBlogsMail } = require("../emailServices/newsletterService");
const multer = require("multer");
const path = require("path");
app.post("/sendEmail", sendEmail);
app.post("/publishBlog", sendBlogsMail);

//middleware
const authenticateToken = (request, response, next) => {
  let jwtToken;
  const authHeader = request.headers["authorization"];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.status(202);
    response.send("Authorization failed");
  } else {
    jwt.verify(jwtToken, "ABPPBH_ST", (error, payload) => {
      if (error) {
        response.status(202);
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
      const payload = {
        email: email,
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
  const blogsArray = await Model.find({});
  try {
    response.send(blogsArray);
  } catch (error) {
    response.send(error);
  }
});

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

  connectionBlogs
    .insertOne({
      title: title,
      description: description,
      category: category,
      blogImage: blogImage,
      username: username,
      userrole: userrole,
      date: date,
      likes: likes,
      comments,
      html: htmlFile,
      savedUsers: savedUsers,
    })
    .then((res) => {
      response.status(200);
      response.json({ message: res.insertedId });
    })
    .catch((err) => {
      response.send(err);
    });
});

//category Api

app.get("/blogs/filter", async (request, response) => {
  const { category = "All" } = request.query;
  if (category === "All") {
    var query = Model.find({});
  } else {
    var query = Model.find({ category: category });
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
    .then((res) => response.send(res))
    .catch((err) => console.log(err));
});

// ADD COMMENTS TO BLOG API
app.post("/comments", authenticateToken, (request, response) => {
  const { comment, id, name, dateObject } = request.body;
  connectionBlogs
    .findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $push: { comments: { comment, name, dateObject } } },
      { $upsert: true },
      { new: true }
    )
    .then((res) => {
      console.log(res);
      response.status(200).json({ message: "new comment added" });
    })
    .catch((err) => response.send(err));
});

// UPDATE PROFILE DETAIL
app.post("/profile", (request, response) => {
  const { designation, gender, name, email, isProfileUpdated } = request.body;
  connection
    .updateOne(
      { email: email },
      {
        $set: {
          name: name,
          designation: designation,
          gender: gender,
          isProfileUpdated: isProfileUpdated,
        },
      }
    )
    .then(async (res) => {
      const profile = await connection.findOne({ email: email });
      console.log(profile, "PROFILE");
      response.status(200).json({
        message: "Thank you, profile details updated successfully!",
        profile,
      });
    })
    .catch((err) => response.send(err));
});

app.get("/profile/check", authenticateToken, (request, response) => {
  const { email } = request;
  connection.findOne({ email: email }).then((res) => {
    if (res.isProfileUpdated === true) {
      response.status(200);
      response.json({ message: "Profile already updated", res });
    } else {
      response.status(202).json({ message: "Not Updated Yet" });
    }
  });
});

app.put("/likes", async (request, response) => {
  const { id } = request.body;
  connectionBlogs
    .findOneAndUpdate({ _id: new ObjectId(id) }, { $inc: { likes: 1 } })
    .then((res) => {
      response.send(res);
    })
    .catch((err) => response.send(err));
});

// SAVE BLOGS API
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
      response.status(200).send(res);
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
      response.status(200).send(res);
    })
    .catch((err) => response.send(err));
});

//GET ALL SAVED BLOGS OF USER API
app.get("/usersaved", authenticateToken, async (request, response) => {
  const { email } = request;
  const savedBlogsArray = await Model.find({});
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
app.post(
  "/post/blogthumb",
  authenticateToken,
  upload.single("image"),
  async (request, response) => {
    const uploadUrl = process.env.UPLOAD_URL;
    const writeToken = process.env.BLOB_READ_WRITE_TOKEN;
    console.log(uploadUrl, writeToken);

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

      console.log(blob, "RESPONSE");

      const { url } = blob; // Adjust based on the response format from `put`
      console.log("Uploaded Image URL:", url);

      return response.status(200).json({ url });
    } catch (error) {
      console.error("Error uploading image:", error);
      response.status(500).json({ error: error.message });
    }
  }
);

module.exports = app;
