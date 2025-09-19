const nodemailer = require("nodemailer");
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const imagePath = path.resolve(__dirname, "BLOG_CERTIFICATE.png");

/**
 * Generate certificate PDF from HTML template
 */
async function generateCertificatePDF(winnerName, monthYear) {
  const imageBase64 = fs.readFileSync(imagePath).toString("base64");
  const htmlTemplate = `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Certificate</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          background: #f2f2f2;
        }
        .certificate {
          position: relative;
          width: 1100px;
          height: 780px;
          background: url('data:image/png;base64,${imageBase64}') no-repeat center center;
          background-size: cover;
          font-family: "Times New Roman", serif;
        }
        .name {
          position: absolute;
          top: 340px;
          left: 0;
          width: 100%;
          text-align: center;
          font-size: 32px;
          font-weight: bold;
          color: #000;
        }
        .date {
          position: absolute;
          bottom: 160px;
          left: 240px;
          font-size: 20px;
          color: #000;
        }
      </style>
    </head>
    <body>
      <div class="certificate">
        <div class="name">${winnerName}</div>
        <div class="date">${monthYear}</div>
      </div>
    </body>
  </html>
  `;
  // console.log(htmlTemplate, "HTML TEMPLATE"); // Optional: can be removed

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(htmlTemplate, { waitUntil: "domcontentloaded" }); // 'domcontentloaded' is faster here

  const pdfPath = `./certificate-${winnerName}.pdf`;

  // 👇 THIS IS THE FIX 👇
  await page.pdf({
    path: pdfPath,
    width: "1100px", // Match the HTML width for better consistency
    height: "780px", // Match the HTML height
    printBackground: true, // This line tells Puppeteer to render the background image
  });

  await browser.close();
  return pdfPath;
}

/**
 * Send winner email with certificate attached
 */
async function sendWinnerEmail(
  winnerEmail,
  winnerName,
  blogTitle,
  dateString,
  date
) {
  const dateObj = new Date(date);
  const monthYear = dateObj.toLocaleString("en-US", {
    month: "long", // "May"
    year: "numeric", // "2025"
  });
  const certPath = await generateCertificatePDF(winnerName, monthYear);

  // 2. Setup transporter
  const transporter = nodemailer.createTransport({
    service: "gmail",
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true,
    auth: {
      user: process.env.SMTP_MAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  // 3. Nice email template
  const htmlBody = `
  <div style="font-family: Arial, sans-serif; padding: 12px">
  <div
    style="
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 8px;
      /* box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08); */
      overflow: hidden;
    "
  >
    <!-- Header -->
    <div
      style="
        background: #f1f1f1;
        color: white;
        text-align: center;
        padding: 25px;
      "
    >
      <h1 style="margin: 0; font-size: 26px; color: #333">
        🎉 Best Blog Award 🎉
      </h1>
    </div>

    <!-- Body -->
    <div style="padding: 30px; text-align: center; color: #333">
      <h2 style="color: #4caf50; margin-bottom: 20px">
        Congratulations, ${winnerName}! 🌟
      </h2>
      <p style="font-size: 16px; line-height: 1.6">
        We are thrilled to announce that your blog
        <b style="color: #333">"${blogTitle}"</b> has been selected as the
        <b style="color: #4caf50">Best Blog of ${monthYear}</b>.
      </p>

      <p style="font-size: 15px; line-height: 1.6; margin: 20px 0; color: #555">
        Please find your certificate attached 🎓 as a token of recognition for
        your valuable contribution.
      </p>

      <p style="font-size: 15px; line-height: 1.6; color: #444">
        Keep inspiring us with your words! ✨
      </p>
    </div>

    <!-- Footer -->
    <div
      style="
        background: #f1f1f1;
        padding: 15px;
        text-align: center;
        font-size: 13px;
        color: #666;
      "
    >
      – Team <b>AAPMOR Blogs</b>
    </div>
  </div>
</div>`;

  // 4. Send mail
  const mailOptions = {
    from: process.env.SMTP_MAIL,
    to: winnerEmail,
    subject: `🏆 Congratulations ${winnerName}! Blog Winner Certificate`,
    html: htmlBody,
    attachments: [
      {
        filename: `Certificate-${winnerName}.pdf`,
        path: certPath,
      },
    ],
  };
  try {
    await transporter.sendMail(mailOptions);
    console.log("EMAIL CERTIFICATE SENT TO:", winnerName);
  } catch (error) {
    console.error("Failed to send email:", error);
  } finally {
    // 5. Cleanup file after sending (even if sending fails)
    fs.unlinkSync(certPath);
    console.log("Cleaned up temporary file:", certPath);
  }
}

module.exports = { sendWinnerEmail };

// const PDFDocument = require("pdfkit");
// // import nodemailer from "nodemailer";
// const nodemailer = require("nodemailer");
// // const puppeteer = require("puppeteer");
// const fs = require("fs");
// const path = require("path");
// /**
//  * Generate the inline HTML certificate
//  */
// function generateCertificateHtml(winnerName, dateString) {
//   const imagePath = path.resolve(__dirname, "BLOG_CERTIFICATE.png");
//   const imageBase64 = fs.readFileSync(imagePath).toString("base64");

//   return `
//   <div style="position: relative; display: inline-block; width: 1100px; height: 780px; font-family: 'Times New Roman', serif;">
//     <!-- Background image -->
//     <img src="data:image/png;base64,${imageBase64}"
//          style="width: 100%; height: 100%; display: block;" alt="Certificate" />

//     <!-- Winner name -->
//     <div style="
//       position: absolute;
//       top: 340px;
//       left: 0;
//       width: 100%;
//       text-align: center;
//       font-size: 32px;
//       font-weight: bold;
//       color: #000;
//     ">
//       ${winnerName}
//     </div>

//     <!-- Date -->
//     <div style="
//       position: absolute;
//       bottom: 160px;
//       left: 240px;
//       font-size: 20px;
//       color: #000;
//     ">
//       ${dateString}
//     </div>
//   </div>
//   `;
// }

// /**
//  * Generate a PDF certificate file
//  */
// function generateCertificatePdf(winnerName, dateString, outputPath) {
//   return new Promise((resolve, reject) => {
//     try {
//       const doc = new PDFDocument({
//         size: [1100, 780],
//         layout: "landscape",
//       });

//       const stream = fs.createWriteStream(outputPath);
//       doc.pipe(stream);

//       // Background image
//       doc.image("BLOG_CERTIFICATE.png", 0, 0, { width: 1100, height: 780 });

//       // Winner name
//       doc
//         .font("Times-Bold")
//         .fontSize(32)
//         .fillColor("black")
//         .text(winnerName, 0, 340, { align: "center" });

//       // Date
//       doc.font("Times-Roman").fontSize(20).text(dateString, 240, 620);

//       doc.end();

//       stream.on("finish", () => resolve(outputPath));
//     } catch (err) {
//       reject(err);
//     }
//   });
// }

// // import { generateCertificateHtml, generateCertificatePdf } from "./certificate.js";

// async function sendCertificateEmail(
//   winnerName,
//   dateString,
//   recipientEmail,
//   blogTitle
// ) {
//   // Setup transporter
//   const transporter = nodemailer.createTransport({
//     host: process.env.SMTP_HOST,
//     port: process.env.SMTP_PORT,
//     secure: false,
//     auth: {
//       user: process.env.SMTP_MAIL,
//       pass: process.env.SMTP_PASS,
//     },
//   });

//   // 1. HTML body
//   const htmlBody = generateCertificateHtml(winnerName, dateString);

//   // 2. Generate PDF attachment
//   const pdfPath = `./certificate-${winnerName}.pdf`;
//   await generateCertificatePdf(winnerName, dateString, pdfPath);

//   // 3. Send email
//   const mailOptions = {
//     from: process.env.SMTP_MAIL,
//     to: recipientEmail,
//     subject: `🎉 Congratulations ${winnerName}! Here is your Blog Winner Certificate`,
//     html: `
//       <p>Dear ${winnerName},</p>
//       <p>Congratulations! 🎉 You’ve been awarded the <b>Best Blog of the Month for the blog ${blogTitle}</b>.</p>
//       <p>Your certificate is below, and a printable PDF is attached.</p>
//       ${htmlBody}
//       <p style="margin-top:20px;">Best regards,<br/>Aapmor Blogs Team</p>
//     `,
//     attachments: [
//       {
//         filename: `Certificate-${winnerName}.pdf`,
//         path: pdfPath,
//         contentType: "application/pdf",
//       },
//     ],
//   };

//   await transporter.sendMail(mailOptions);
// }

// module.exports = { sendCertificateEmail };
