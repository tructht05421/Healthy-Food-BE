const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  console.log("Preparing to send email...");
  console.log("EMAIL_USER:", process.env.EMAIL_USER);
  console.log("EMAIL_PASS:", process.env.EMAIL_PASS);
  console.log("To:", options.email);
  console.log("Subject:", options.subject);

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"HEALTHY_FOOD" <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    html: options.html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.response);
    return info; // Trả về thông tin nếu cần
  } catch (error) {
    console.error("Error sending email:", error);
    throw error; // Ném lỗi để controller xử lý
  }
};

module.exports = sendEmail;
