const expressAsyncHandler = require("express-async-handler");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");
const { generateOTP } = require("./otpGenerate");
const { connection } = require("../connections/database");

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
  console.log(email);
  const otp = generateOTP();

  const message = `Thank you for taking the first step to verify your email address with us. Your security is important to us, and this extra layer of protection ensures that your email is valid and secure.
         
To complete the email confirmation process, please use the following One-Time Passcode (OTP):

OTP: ${otp}

Please enter this OTP on the verification page to confirm your email address. If you did not initiate this request or have any concerns about the security of your account, please contact our support team immediately.

Thank you for choosing us. We appreciate your trust in our services.

Sincerely,
Aapmor | Blogs`;
  // connection.findOne({ email: email }).then((res) => {
  //   if (res !== null) {
  var mailOptions = {
    from: process.env.SMTP_MAIL,
    to: email,
    subject: "Email Confirmation: Your One-Time Passcode (OTP)",
    text: message,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      response.send(error);
    } else {
      response.json({ message: "Email sent successfully!", otp });
    }
  });
  // } else {
  //   response.status(202).json({ message: "Email Id doesn't exist" });
  // }
  // });
});
module.exports = { sendEmail };
