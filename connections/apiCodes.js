const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const app = express();
const { connection } = require("./connect");
// const { sendEmail } = require("./sendMail");
const { sendEmail } = require("../emailVerification/emailControllers");

// const { client } = require("./connect");

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
  const { email, password } = request.body;
  connection
    .findOne({ email: email })
    .then(async (respObj) => {
      if (respObj === null) {
        response.status(202).json({ message: "Invalid email" });
      } else {
        const isPasswordMatched = await bcrypt.compare(
          password,
          respObj.password
        );
        if (isPasswordMatched === true) {
          const payload = {
            email: email,
          };
          const jwt_token = jwt.sign(payload, "SECRET");
          response.status(200).json({ jwt_token });
        } else {
          response.status(202).json({ message: "Invalid Password" });
        }
      }
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
module.exports = app;