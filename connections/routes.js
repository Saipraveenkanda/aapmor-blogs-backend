const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const app = express();
const { connection, connectionBlogs } = require("./database");
const { Model } = require("./schema");
// const { sendEmail } = require("./sendMail");
const { sendEmail } = require("../emailVerification/emailControllers");

// const { client } = require("./connect");

app.post("/sendEmail", sendEmail);

// Register API

// app.post("/api/register", async (request, response) => {
//   const { firstname, lastname, email, password, isEmployee } = request.body;
//   const hashedPassword = await bcrypt.hash(password, 10);
//   connection.findOne({ email: email }).then((res) => {
//     if (res === null) {
//       connection
//         .insertOne({
//           firstname: firstname,
//           lastname: lastname,
//           email: email,
//           password: hashedPassword,
//           isEmployee: isEmployee,
//         })
//         .then((resp) => {
//           response.status(201).json({ message: "User created successfully" });
//         });
//     } else {
//       response.json({ message: "Email already Exists" });
//     }
//   });
// });

// Login API

app.post("/api/login", async (request, response) => {
  const { email } = request.body;
  connection
    .insertOne({ email: email })
    .then((res) => {
      const payload = {
        email: email,
      };
      const jwt_token = jwt.sign(payload, "SECRET");
      response.status(200).json({ jwt_token });
    })
    .catch((err) => response.send(err));
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

app.post("/blogs", async (request, response) => {
  const {
    title,
    description,
    category,
    blogImage,
    username,
    userrole,
    date,
    likes,
    commentsArray,
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
      comments: commentsArray,
    })
    .then((res) => {
      console.log(res);
      response.status(200);
      response.send(res);
    })
    .catch((err) => {
      response.send(err);
    });
});

module.exports = app;
