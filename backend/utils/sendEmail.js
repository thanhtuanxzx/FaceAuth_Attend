import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const sendEmail = async (to, subject, text) => {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.MAIL_USERNAME,
                pass: process.env.MAIL_PASSWORD
            }
        });

        await transporter.sendMail({
            from: process.env.MAIL_FROM_ADDRESS,
            to,
            subject,
            text
        });

        console.log(`✅ Email gửi thành công đến ${to}`);
    } catch (error) {
        console.error("❌ Lỗi gửi email:", error);
    }
};

export default sendEmail;
