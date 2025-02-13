import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import connectDB from "./db/connect.js"; // Kết nối MongoDB
import User from "./models/User.js";
import Activity from "./models/Activity.js";
import AttendanceRecord from "./models/AttendanceRecord.js";
import Log from "./models/Log.js";

dotenv.config();

const seedData = async () => {
    try {
        await connectDB(); // Kết nối database
        console.log("🔗 Kết nối MongoDB thành công!");

        // 1️⃣ Xóa toàn bộ dữ liệu cũ
        await Promise.all([
            User.deleteMany(),
            Activity.deleteMany(),
            AttendanceRecord.deleteMany(),
            Log.deleteMany(),
        ]);
        console.log("🗑️ Đã xóa toàn bộ dữ liệu cũ.");

        // 2️⃣ Tạo Super Admin
        const hashedPassword = await bcrypt.hash("123456", 10);
        const superAdmin = await User.create({
            name: "Super Admin",
            email: "superadmin@example.com",
            password: hashedPassword,
            role: "super_admin",
            isVerified: true,
        });

        console.log("✅ Đã tạo tài khoản Super Admin:", superAdmin.email);

        // 3️⃣ Tạo Admin
        const admin = await User.create({
            name: "Admin User",
            email: "admin@example.com",
            password: hashedPassword,
            role: "admin",
            isVerified: true,
        });

        console.log("✅ Đã tạo tài khoản Admin:", admin.email);

        // 4️⃣ Tạo Sinh viên mẫu
        const student = await User.create({
            name: "Nguyễn Văn A",
            email: "student@example.com",
            password: hashedPassword,
            role: "student",
            isVerified: true,
        });

        console.log("✅ Đã tạo tài khoản Sinh viên:", student.email);

        // 5️⃣ Tạo Hoạt động mẫu
        const activity = await Activity.create({
            name: "Hoạt động tình nguyện",
            description: "Hoạt động giúp đỡ người nghèo",
            date: new Date(),
            created_by: admin._id, // Admin tạo hoạt động
        });

        console.log("✅ Đã tạo hoạt động:", activity.name);

        console.log("🎉 Seed dữ liệu hoàn tất!");
        
        // Đóng kết nối MongoDB
        await mongoose.connection.close();
        console.log("🔌 Đã đóng kết nối MongoDB.");
        
        process.exit(0);
    } catch (error) {
        console.error("❌ Lỗi khi seed dữ liệu:", error);
        process.exit(1);
    }
};

// Chạy function seed
seedData();
