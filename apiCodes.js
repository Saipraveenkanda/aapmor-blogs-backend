const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const app = express();
const { MongoClient } = require("mongodb");
const client = new MongoClient("mongodb://localhost:27017");

// Register API

app.post("/register", async (request, response) => {
  const { firstname, lastname, email, password, isEmployee } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  client
    .db("Blogsdata")
    .collection("users")
    .findOne({ email: email })
    .then((res) => {
      if (res === null) {
        client
          .db("Blogsdata")
          .collection("users")
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

app.post("/login", async (request, response) => {
  const { email, password } = request.body;
  client
    .db("Blogsdata")
    .collection("users")
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
