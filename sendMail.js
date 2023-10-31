const expressAsyncHandler = require("express-async-handler");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");
const { generateOTP } = require("./otpGenerate");
dotenv.config();

let transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_MAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

const sendEmail = expressAsyncHandler((email) => {
  //   const { email } = req.body;
  console.log(email);

  const otp = generateOTP();

  var mailOptions = {
    from: process.env.SMTP_MAIL,
    to: email,
    subject: "OTP form Callback Coding",
    text: `Your OTP is: ${otp}`,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error, "transporter error");
    } else {
      console.log("Email sent successfully!");
    }
  });
});

module.exports = { sendEmail };
