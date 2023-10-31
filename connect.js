const express = require("express");
const { MongoClient } = require("mongodb");
const client = new MongoClient("mongodb://localhost:27017");

const dataBase = "Blogsdata";
const collection = "users";

const connection = client.db(dataBase).collection(collection);
exports.connection = connection;
// module.exports = client;

//sample code
