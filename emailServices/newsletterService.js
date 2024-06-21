const expressAsyncHandler = require("express-async-handler");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");
const { EmailModel } = require("../connections/schema");
const path = require("path");
const fs = require("fs");
const htmlPath = path.join(__dirname, "newsLetter.html");
const htmlFile = fs.readFileSync(htmlPath, "utf-8");

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

const replaceHtml = (content) => {
  let modifiedHtml;
  const { title, description, dateObject, blogImage, blogId } = content;
  const replaceObj = {
    uniquetitle: title,
    uniquedescription: description,
    uniquedate: dateObject,
  };
  modifiedHtml = htmlFile.replace(
    /uniquetitle|uniquedescription|uniquedate/gi,
    function (matched) {
      return replaceObj[matched];
    }
  );
  let finalHtml = modifiedHtml.replace(
    /<img[^>]*\ssrc="[^"]*"/,
    '<img src="' + blogImage + '"'
  );
  let newBlogLink = `http://localhost:3000/blogs/${blogId}`;
  let resultHtml = finalHtml.replace(
    /<a[^>]*\shref="[^"]*"/,
    '<a href="' + newBlogLink + '"'
  );
  return resultHtml;
};

const sendBlogsMail = expressAsyncHandler(async (request, response) => {
  // HTML FILE FROM REQUEST BODY
  const content = request.body;
  const resultHtml = replaceHtml(content);

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
    html: resultHtml,
  };

  //commenting sending emails to all users for testing

  transporter.sendMail(mailOptions, async (error, info) => {
    if (error) {
      response.send(error);
    } else {
      response.send(info);
    }
  });
});
module.exports = { sendBlogsMail };
