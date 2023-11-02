const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const app = express();
const { connection } = require("./database");
// const { sendEmail } = require("./sendMail");
const { sendEmail } = require("../emailVerification/emailControllers");
const { Model } = require("mongoose");

// const { client } = require("./connect");

// Send OTP API
app.post("/sendEmail", sendEmail);

// Register API

app.post("/api/register", async (request, response) => {
  const { firstname, lastname, email, password, isEmployee } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  connection.findOne({ email: email }).then((res) => {
    if (res === null) {
      connection
        .insertOne({
          firstname: firstname,
          lastname: lastname,
          email: email,
          password: hashedPassword,
          isEmployee: isEmployee,
        })
        .then((resp) => {
          response.status(201).json({ message: "User created successfully" });
        });
    } else {
      response.json({ message: "Email already Exists" });
    }
  });
});

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
  } catch (err) {
    response.send(err);
  }
});

module.exports = app;
