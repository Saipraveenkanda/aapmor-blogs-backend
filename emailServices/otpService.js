const expressAsyncHandler = require("express-async-handler");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");
const { getOtp } = require("../otp");
const { connection, connectionEmail } = require("../connections/database");
const bcrypt = require("bcrypt");

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

const sendEmail = expressAsyncHandler(async (request, response) => {
  const { email } = request.body;
  const otpCode = getOtp();
  // console.log(otpCode);
  const message = `<p>
  Dear User,<br/>
  To ensure the security of your account, we have implemented a one-time password (OTP) verification for logging into our blog application.
  
  <br/>
  <h3>Your OTP is:<bold>${otpCode}</bold></h3>
  
  Please use this code within the next 10 minutes to complete the login process. If you didn't request this OTP or if you encounter any issues, please contact our support team immediately
  Thank you for being a part of our blogging community! 📝
  <br/>
  <br/>
  Best regards,<br/>
  Aapmor|Blogs
  </p>
  `;

  var mailOptions = {
    from: process.env.SMTP_MAIL,
    to: email,
    subject: "Email Confirmation: Your One-Time Passcode (OTP)",
    html: message,
  };

  transporter.sendMail(mailOptions, async (error, info) => {
    if (error) {
      response.send(error);
    } else {
      const hashedOtp = await bcrypt.hash(otpCode, 10);
      connection.findOne({ email: email }).then((userObj) => {
        if (userObj !== null) {
          console.log("User already exists, updating OTP in Database");
          connection
            .updateOne({ email: email }, { $set: { otp: hashedOtp } })
            .then((res) => {
              response.status(200);
              response.json({ message: `OTP sent to ${email}` });
            });
        } else {
          console.log("User doesnn't exist, creating one in database");
          connection
            .insertOne({
              email: email,
              otp: hashedOtp,
              isProfileUpdated: false,
            })
            .then((res) => {
              console.log(res);
              response.status(200);
              response.json({ message: `OTP sent to ${email}` });
            });
          connectionEmail.insertOne({
            email: email,
          });
        }
      });
    }
  });
});
module.exports = { sendEmail };
