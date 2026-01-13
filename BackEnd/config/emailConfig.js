import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

export const sendEmail = async (toEmail, subject, htmlContent) => {
  try {
    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: { name: "Athenura", email: process.env.FROM_EMAIL },
        to: [{ email: toEmail }],
        subject,
        htmlContent,
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("❌ Email send error:", error.response?.data || error.message);
  }
};
