const expressAsyncHandler = require("express-async-handler");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");
dotenv.config();

let transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_MAIL,
    pass: process.env.SMTP_PASSWORD,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
});

const sendCommentMail = expressAsyncHandler(async (blog, comment, id) => {
  const { email, username, title } = blog;
  console.log(email, "FROM BLOG");
  const message = `<p>
    Hi ${username},
    
    <br/>
    <h3>Good news! Someone has just commented on your blog post, "${title}".</h3>
    
    Here's a preview of the comment: "${comment}"
    <br/>
    Click the link below to view the full comment and join the conversation:
    <br/>
     <a href=https://aapmor-blogs.vercel.app/blogs/${id}>View Comment</a>
    <br/>
    <br/>
    <h3>Thank you for sharing your thoughts with the world. Keep blogging!</h3>
    <br/>
    <br/>
    Best regards,
    <br/>
    The Aapmor Blogs Team
    <br/>
    <a href="https://aapmor-blogs.vercel.app">Aapmor Blogs hub</a>
    </p>
  `;

  var mailOptions = {
    from: process.env.SMTP_MAIL,
    to: email,
    subject: "New Comment on Your Blog Post - Check It Out!",
    html: message,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
  }
});
module.exports = { sendCommentMail };
