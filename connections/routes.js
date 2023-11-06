const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const app = express();
const { connection, connectionBlogs } = require("./database");
const { Model } = require("./schema");
// const { sendEmail } = require("./sendMail");
const { sendEmail } = require("../emailVerification/emailControllers");
const { ObjectId } = require("mongodb");

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
  connection.findOne({ email: email }).then((resObj) => {
    if (resObj === null) {
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
    } else {
      const payload = {
        email: email,
      };
      const jwt_token = jwt.sign(payload, "SECRET");
      response.status(200).json({ jwt_token });
    }
  });
});

app.put("/users", async (request, response) => {
  const { updatePassword, email } = request.body;
  console.log(request.body);
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
      response.status(200);
      response.send(res);
    })
    .catch((err) => {
      response.send(err);
    });
});

//category Api

app.get("/blogs/filter", async (request, response) => {
  const { category } = request.query;
  if (category === "All") {
    var query = Model.find({});
  } else {
    var query = Model.find({ category: category });
  }
  const blogsByCategory = await query;
  try {
    response.send(blogsByCategory);
  } catch (error) {
    response.send(error);
  }
});

//blog view comp
app.get("/blogs/:id", (request, response) => {
  const { id } = request.params;
  console.log(id);
  connectionBlogs
    .findOne({ _id: new ObjectId(id) })
    .then((res) => response.send(res))
    .catch((err) => console.log(err));
});
module.exports = app;
