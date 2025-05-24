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
  const accentColor = "#FF8F07";
  const message = `
  <body style="margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; background-color: #f9f9f9;">
    <div style=" margin: auto; padding: 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);">
      <h2 style="color: ${accentColor}; margin-bottom: 20px;">Aapmor Blogs - OTP Verification</h2>
      
      <p style="font-size: 16px; color: #333333; line-height: 1.6;">
        Dear User,
        <br /><br />
        To ensure the security of your account, we have enabled One-Time Password (OTP) verification for login to Aapmor Blogs.
      </p>

      <div style="margin: 30px 0; padding: 15px; background-color: #f0f4ff; border-left: 6px solid ${accentColor}; border-radius: 4px;">
        <p style="font-size: 18px; margin: 0; color: #111;">
          <strong>Your OTP is:</strong>
          <span style="font-size: 22px; font-weight: bold; color: ${accentColor};">${otpCode}</span>
        </p>
      </div>

      <p style="font-size: 16px; color: #333333;">
        Please use this code within the next <strong>10 minutes</strong> to complete your login.
        <br />
        If you did not request this OTP or face any issues, please contact our support team immediately.
        <br /><br />
        Thank you for being a part of the Aapmor Blogs community! 📝
      </p>

      <p style="font-size: 16px; color: #666666; margin-top: 30px;">
        Best regards,<br />
        <strong>Aapmor Blogs Team</strong>
      </p>
    </div>
  </body>`;
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
            .updateOne(
              { email: email },
              { $set: { otp: hashedOtp, lastLogin: new Date() } }
            )
            .then((res) => {
              response.status(200);
              response.json({ message: `OTP sent to ${email}` });
            });
        } else {
          console.log("User does not exist, creating one in database");
          connection
            .insertOne({
              email: email,
              otp: hashedOtp,
              isProfileUpdated: false,
              timeStamp: new Date(),
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
