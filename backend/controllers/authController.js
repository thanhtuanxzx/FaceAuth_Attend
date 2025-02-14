import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import sendEmail from "../utils/sendEmail.js";
import dotenv from "dotenv";
import nodemailer from 'nodemailer';
import Log from "../models/Log.js";

dotenv.config();

// 📝 Đăng ký tài khoản
export const register = async (req, res) => {
    try {
        const { name, email, password, role = "student" } = req.body;

        // Nếu role khác "student", từ chối đăng ký
        if (role !== "student") {
            return res.status(403).json({ message: "Bạn không thể đăng ký với vai trò này!" });
        }

        // Kiểm tra xem email đã tồn tại chưa
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: "Email đã tồn tại!" });

        // Mã hóa mật khẩu
        const hashedPassword = await bcrypt.hash(password, 10);

        // Tạo user mới nhưng chưa xác thực
        user = new User({ name, email, password: hashedPassword, role, isVerified: false });
        await user.save();

        // Tạo token xác thực email
        const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "1h" });

        // Gửi email xác thực
        const verifyLink = `http://localhost:${process.env.PORT}/api/auth/verify/${token}`;
        await sendEmail(email, "Xác thực tài khoản", `Nhấn vào link sau để xác thực tài khoản: ${verifyLink}`);

        res.status(201).json({ message: "Đăng ký thành công! Hãy kiểm tra email để xác thực tài khoản." });
    } catch (error) {
        console.error("Lỗi đăng ký:", error);
        res.status(500).json({ message: "Lỗi đăng ký", error });
    }
};


// 📝 Xác thực tài khoản qua email
export const verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;

        // Giải mã token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const email = decoded.email;

        // Cập nhật trạng thái xác thực
        const user = await User.findOneAndUpdate({ email }, { isVerified: true }, { new: true });

        if (!user) return res.status(400).json({ message: "Token không hợp lệ!" });

        res.json({ message: "Xác thực email thành công! Bạn có thể đăng nhập." });
    } catch (error) {
        res.status(500).json({ message: "Lỗi xác thực email", error });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            await Log.create({
                user_id: null, // Không có user_id vì email không tồn tại
                action: "Đăng nhập thất bại",
                description: `Đăng nhập thất bại: Email ${email} không tồn tại`,
                timestamp: new Date(),
            });
            return res.status(400).json({ message: 'Email không tồn tại' });
        }

        // Kiểm tra tài khoản đã xác thực hay chưa
        if (!user.isVerified) {
            await Log.create({
                user_id: user._id,
                action: "Đăng nhập thất bại",
                description: `Người dùng ${user._id} cố gắng đăng nhập nhưng tài khoản chưa xác thực`,
                timestamp: new Date(),
            });
            return res.status(403).json({ message: 'Tài khoản chưa được xác thực. Vui lòng kiểm tra email!' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            await Log.create({
                user_id: user._id,
                action: "Đăng nhập thất bại",
                description: `Người dùng ${user._id} nhập sai mật khẩu`,
                timestamp: new Date(),
            });
            return res.status(401).json({ message: 'Mật khẩu không đúng' });
        }

        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // ✅ Lưu log đăng nhập thành công
        await Log.create({
            user_id: user._id,
            action: "Đăng nhập thành công",
            description: `Người dùng ${user._id} đã đăng nhập thành công`,
            timestamp: new Date(),
        });

        res.json({ token, message: 'Đăng nhập thành công' });
    } catch (error) {
        await Log.create({
            user_id: null,
            action: "Lỗi hệ thống",
            description: `Lỗi đăng nhập: ${error.message}`,
            timestamp: new Date(),
        });

        res.status(500).json({ message: 'Lỗi đăng nhập', error });
    }
};


export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        // Kiểm tra xem email có trong database không
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Email không tồn tại' });
        }

        // Tạo token đặt lại mật khẩu (hết hạn trong 1 giờ)
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Gửi email chứa link đặt lại mật khẩu
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.MAIL_USERNAME,
                pass: process.env.MAIL_PASSWORD,
            },
        });

        const resetLink = `http://localhost:3000/reset-password/${token}`;
        const mailOptions = {
            from: process.env.MAIL_FROM_ADDRESS,
            to: email,
            subject: 'Đặt lại mật khẩu',
            text: `Bạn đã yêu cầu đặt lại mật khẩu. Nhấn vào liên kết sau để đặt lại mật khẩu: ${resetLink}\n\nLiên kết có hiệu lực trong 1 giờ.`,
        };

        await transporter.sendMail(mailOptions);

        return res.json({ message: 'Hãy kiểm tra email của bạn để đặt lại mật khẩu' });

    } catch (error) {
        console.error('Lỗi quên mật khẩu:', error); // Ghi log lỗi để kiểm tra
        return res.status(500).json({ message: 'Lỗi quên mật khẩu', error });
    }
};



// Xử lý đặt lại mật khẩu
export const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        // Giải mã token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) return res.status(400).json({ message: "Token không hợp lệ hoặc đã hết hạn" });

        // Mã hóa mật khẩu mới
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        res.json({ message: "Mật khẩu đã được đặt lại thành công" });
    } catch (error) {
        res.status(500).json({ message: "Lỗi đặt lại mật khẩu", error });
    }
};
