const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const app = express();
const { connection } = require("./connect");
// const { client } = require("./connect");

// Register API

app.post("/register", async (request, response) => {
  const { firstname, lastname, email, password, isEmployee } = request.body;
  console.log(password);
  const hashedPassword = await bcrypt.hash(password, 10);
  console.log(connection);
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
        .then((res) => {
          console.log(res);
          response.json({ message: "User created successfully" });
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
        response.status(400);
        response.json({ message: "Invalid email" });
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
          response.json({ jwt_token });
        } else {
          response.status(400);
          response.json({ message: "Invalid Password" });
        }
      }
    })
    .catch((err) => response.send(err));
});

module.exports = app;
