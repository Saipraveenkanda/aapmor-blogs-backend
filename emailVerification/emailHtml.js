const expressAsyncHandler = require("express-async-handler");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");
const { EmailModel } = require("../connections/schema");
// const path = require("path");
// const fs = require("fs");
// const htmlPath = path.join(__dirname, "content.html");
// const htmlFile = fs.readFileSync(htmlPath, "utf-8");

dotenv.config();

let transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_MAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

const sendBlogsMail = expressAsyncHandler(async (request, response) => {
  // HTML FILE FROM REQUEST BODY
  const content = request.body.htmlContent;
  console.log(content);

  // CODE FOR GETTING ALL USERS EMAIL ID
  let userMap = await EmailModel.find({}, { _id: 0 });
  const emailsArray = [];
  userMap.forEach((user) => {
    emailsArray.push(user._doc.email);
  });

  var mailOptions = {
    from: process.env.SMTP_MAIL,
    to: emailsArray,
    subject: "Stay Connected: Your Weekly Company Updates",
    html: content,
  };

  transporter.sendMail(mailOptions, async (error, info) => {
    if (error) {
      response.send(error);
    } else {
      response.send(info);
    }
  });
});
module.exports = { sendBlogsMail };
