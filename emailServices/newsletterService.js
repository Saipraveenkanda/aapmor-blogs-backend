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

const replaceHtml = (content, origin) => {
  let modifiedHtml;
  let modifiedHtml2;
  const {
    title,
    description,
    dateObject,
    blogImage,
    blogId,
    name,
    role,
    editorHtml,
  } = content;
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
  modifiedHtml2 = modifiedHtml.replace(
    /Weekly Newsletter/gi,
    "Discover " + name + "'s Latest Blog : Click to Read Now!"
  );
  let finalHtml = modifiedHtml2.replace(
    /<img[^>]*\ssrc="[^"]*"/,
    '<img src="' + blogImage + '"'
  );
  // let newBlogLink = `https://blogs.aapmor.com/blogs/${blogId}`;
  let newBlogLink = `${origin}/blogs/${blogId}`; //for testing
  let resultHtml = finalHtml.replace(
    /<a[^>]*\shref="[^"]*"/,
    '<a href="' + newBlogLink + '"'
  );
  return resultHtml;
};
const blogSubjects = [
  "Insights Unlocked: A New Blog by One of Your Peers!",
  "Peer Spotlight: Check Out This Fresh Blog!",
  "Straight from Your Team: A Blog You Can’t Miss!",
  "Your Colleague Just Wrote This – Have a Look!",
  "Fresh Ideas, Fresh Blog – Written by One of You!",
  "From a Peer, for You: A Blog Worth Reading!",
  "A Thoughtful Blog by Your Fellow Teammate!",
  "Someone from Your Team Just Dropped a Blog!",
  "New Blog Alert: A Peer’s Perspective Awaits!",
  "One of Your Own Wrote This – Give It a Read!",
];

function getRandomBlogSubject() {
  const randomIndex = Math.floor(Math.random() * blogSubjects.length);
  return blogSubjects[randomIndex];
}

const sendBlogsMail = expressAsyncHandler(async (request, response) => {
  const referer = request.get("Referer"); // Full URL where the request originated
  const origin = request.get("Origin");
  console.log(origin, referer);
  const content = request.body;
  const resultHtml = replaceHtml(content, origin);

  // CODE FOR GETTING ALL USERS EMAIL ID
  let userMap = await EmailModel.find({}, { _id: 0 });
  const emailsArray = [];
  userMap.forEach((user) => {
    emailsArray.push(user._doc.email);
  });
  var mailOptions = {
    from: process.env.SMTP_MAIL,
    to: emailsArray,
    // to: [
    //   "praveensaik@aapmor.com",
    //   "ganeshg@aapmor.com",
    //   "rajeswarivalagandlak@aapmor.com",
    // ],
    subject: getRandomBlogSubject(),
    html: resultHtml,
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
