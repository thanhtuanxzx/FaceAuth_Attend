import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import connectDB from "./db/connect.js";
import User from "./models/User.js";
import Activity from "./models/Activity.js";
import AttendanceRecord from "./models/AttendanceRecord.js";//DisciplinaryRecord  Evaluation  Transaction
import DisciplinaryRecord from "./models/DisciplinaryRecord.js";
import Evaluation from "./models/Evaluation.js";
import Transaction from "./models/Transaction.js";
import Log from "./models/Log.js";

dotenv.config();

const clearDatabase = async () => {
    try {
        console.log("🗑️ Đang xóa toàn bộ bảng dữ liệu...");
        await Promise.all([
            mongoose.connection.db.dropCollection("users").catch(() => {}),
            mongoose.connection.db.dropCollection("activities").catch(() => {}),
            mongoose.connection.db.dropCollection("attendancerecords").catch(() => {}),
            mongoose.connection.db.dropCollection("disciplinaryrecords").catch(() => {}),
            mongoose.connection.db.dropCollection("evaluations").catch(() => {}),
            mongoose.connection.db.dropCollection("transactions").catch(() => {}),
            mongoose.connection.db.dropCollection("logs").catch(() => {}),
        ]);
        console.log("✅ Đã xóa toàn bộ bảng dữ liệu.");
    } catch (error) {
        console.error("❌ Lỗi khi xóa bảng dữ liệu:", error);
        process.exit(1);
    }
};

const seedData = async () => {
    try {
        await connectDB();
        console.log("🔗 Kết nối MongoDB thành công!");

        // Xóa toàn bộ dữ liệu cũ
        await clearDatabase();

        // Mật khẩu mặc định đã băm
        const hashedPassword = await bcrypt.hash("123456", 10);

        // Danh sách tài khoản cần tạo
        const users = [
            { name: "Super Admin", email: "superadmin@example.com", role: "super_admin" },
            { name: "Admin User", email: "admin@example.com", role: "admin" },
            { name: "Nguyễn Văn A", email: "student@example.com", role: "student" }
        ];

        // Tạo người dùng
        const createdUsers = await User.insertMany(users.map(user => ({
            ...user,
            password: hashedPassword,
            isVerified: true,
        })));
        console.log("✅ Đã tạo tài khoản người dùng.");

        const admin = createdUsers.find(user => user.role === "admin");

        

        console.log("🎉 Seed dữ liệu hoàn tất!");
        await mongoose.connection.close();
        console.log("🔌 Đã đóng kết nối MongoDB.");
        process.exit(0);
    } catch (error) {
        console.error("❌ Lỗi khi seed dữ liệu:", error);
        process.exit(1);
    }
};

if (process.argv.includes("--clear")) {
    (async () => {
        await connectDB();
        await clearDatabase();
        await mongoose.connection.close();
        console.log("🔌 Đã đóng kết nối MongoDB sau khi xóa dữ liệu.");
        process.exit(0);
    })();
} else {
    seedData();
}