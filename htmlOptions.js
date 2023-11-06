const path = require("path");

const fs = require("fs");

const htmlPath = path.join(__dirname, "htmlFile.html");

const htmlBody = fs.readFileSync(htmlPath, "utf-8");
