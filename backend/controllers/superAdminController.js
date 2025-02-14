import User from "../models/User.js";
import Activity from "../models/Activity.js";
import AttendanceRecord from "../models/AttendanceRecord.js";
import Log from "../models/Log.js";
import bcrypt from "bcrypt";

// ✅ 1️⃣ Tạo tài khoản Admin
export const createAdmin = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const newAdmin = await User.create({
            name,
            email,
            password: hashedPassword,
            role: "admin",
        });

        res.status(201).json({ message: "Admin đã được tạo", admin: newAdmin });
    } catch (error) {
        res.status(500).json({ message: "Lỗi tạo Admin", error });
    }
};

// ✅ 2️⃣ Xóa tài khoản Admin
export const deleteAdmin = async (req, res) => {
    try {
        const { adminId } = req.params;
        await User.findByIdAndDelete(adminId);
        res.json({ message: "Admin đã bị xóa" });
    } catch (error) {
        res.status(500).json({ message: "Lỗi xóa Admin", error });
    }
};

// ✅ 3️⃣ Lấy danh sách Admin
export const getAllAdmins = async (req, res) => {
    try {
        const admins = await User.find({ role: "admin" });
        res.json(admins);
    } catch (error) {
        res.status(500).json({ message: "Lỗi lấy danh sách Admin", error });
    }
};

// ✅ 4️⃣ Quản lý sinh viên (Tạo, Xóa, Cập nhật)
export const createStudent = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const newStudent = await User.create({
            name,
            email,
            password: hashedPassword,
            role: "student",
        });

        res.status(201).json({ message: "Sinh viên đã được tạo", student: newStudent });
    } catch (error) {
        res.status(500).json({ message: "Lỗi tạo sinh viên", error });
    }
};

export const deleteStudent = async (req, res) => {
    try {
        const { studentId } = req.params;
        await User.findByIdAndDelete(studentId);
        res.json({ message: "Sinh viên đã bị xóa" });
    } catch (error) {
        res.status(500).json({ message: "Lỗi xóa sinh viên", error });
    }
};

export const getAllStudents = async (req, res) => {
    try {
        const students = await User.find({ role: "student" });
        res.json(students);
    } catch (error) {
        res.status(500).json({ message: "Lỗi lấy danh sách sinh viên", error });
    }
};

// ✅ 5️⃣ Quản lý hoạt động (Tạo, Cập nhật, Xóa)
// export const createActivity = async (req, res) => {
//     try {
//         // console.log("📥 Dữ liệu nhận được:", req.body);
//         // console.log("👤 Người tạo:", req.user); // Kiểm tra thông tin người tạo

//         const { name, description, date } = req.body;

//         // Kiểm tra nếu không có req.user.id
//         if (!req.user || !req.user.id) {
//             return res.status(403).json({ message: "Bạn không có quyền tạo hoạt động!" });
//         }

//         const newActivity = await Activity.create({
//             name,
//             description,
//             date,
//             created_by: req.user.id, // Super Admin tạo
//         });

//         // console.log("✅ Hoạt động đã tạo:", newActivity);
//         res.status(201).json({ message: "Hoạt động đã được tạo", activity: newActivity });
//     } catch (error) {
//         console.error("❌ Lỗi tạo hoạt động:", error);
//         res.status(500).json({ message: "Lỗi tạo hoạt động", error: error.message });
//     }
// };
export const createActivity = async (req, res) => {
    try {
        const { name, description, date, locations } = req.body;

        // Kiểm tra quyền tạo hoạt động
        if (!req.user || !req.user.id) {
            return res.status(403).json({ message: "Bạn không có quyền tạo hoạt động!" });
        }

        // Kiểm tra danh sách địa điểm
        if (!Array.isArray(locations) || locations.length === 0) {
            return res.status(400).json({ message: "Hoạt động cần có ít nhất một địa điểm!" });
        }

        // Kiểm tra từng địa điểm có lat, lon, radius không
        for (const location of locations) {
            if (!location.lat || !location.lon || !location.radius) {
                return res.status(400).json({ message: "Mỗi địa điểm phải có lat, lon và radius!" });
            }
        }

        // Tạo hoạt động với danh sách địa điểm
        const newActivity = await Activity.create({
            name,
            description,
            date,
            locations: locations.map(loc => ({
                lat: loc.lat,
                lon: loc.lon,
                radius: loc.radius
            })), // Đảm bảo lưu đúng định dạng
            created_by: req.user.id,
        });

        res.status(201).json({
            message: "Hoạt động đã được tạo",
            activity: newActivity
        });
    } catch (error) {
        console.error("❌ Lỗi tạo hoạt động:", error);
        res.status(500).json({ message: "Lỗi tạo hoạt động", error: error.message });
    }
};




export const deleteActivity = async (req, res) => {
    try {
        const { activityId } = req.params;
        await Activity.findByIdAndDelete(activityId);
        res.json({ message: "Hoạt động đã bị xóa" });
    } catch (error) {
        res.status(500).json({ message: "Lỗi xóa hoạt động", error });
    }
};

export const getAllActivities = async (req, res) => {
    try {
        const activities = await Activity.find();
        res.json(activities);
    } catch (error) {
        res.status(500).json({ message: "Lỗi lấy danh sách hoạt động", error });
    }
};

// ✅ 6️⃣ Lấy danh sách điểm danh của sinh viên
export const getAttendanceRecords = async (req, res) => {
    try {
        const records = await AttendanceRecord.find().populate("student_id activity_id");
        res.json(records);
    } catch (error) {
        res.status(500).json({ message: "Lỗi lấy danh sách điểm danh", error });
    }
};

// ✅ 7️⃣ Xem log hệ thống
export const getSystemLogs = async (req, res) => {
    try {
        const logs = await Log.find().populate("user_id");
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: "Lỗi lấy log hệ thống", error });
    }
};
