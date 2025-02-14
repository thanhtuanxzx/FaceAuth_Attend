import User from "../models/User.js";
import Activity from "../models/Activity.js";
import AttendanceRecord from "../models/AttendanceRecord.js";
import Log from "../models/Log.js";
import bcrypt from "bcrypt";
import mongoose from "mongoose";


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

        // 🔍 Kiểm tra admin có tồn tại không trước khi xóa
        const admin = await User.findById(adminId);
        if (!admin) {
            return res.status(404).json({ message: "Admin không tồn tại!" });
        }

        // 🗑️ Xóa admin
        await User.findByIdAndDelete(adminId);

        // ✅ Lưu log xóa admin
        await Log.create({
            user_id: req.user.id, // Người thực hiện hành động
            action: "Xóa Admin",
            description: `Super Admin ${req.user.id} đã xóa Admin ${adminId} (${admin.name})`,
            timestamp: new Date(),
        });

        res.json({ message: `Admin ${admin.name} đã bị xóa` });
    } catch (error) {
        console.error("❌ Lỗi xóa Admin:", error);

        // ❌ Lưu log lỗi
        await Log.create({
            user_id: req.user ? req.user.id : null,
            action: "Lỗi",
            description: `Lỗi khi xóa Admin: ${error.message}`,
            timestamp: new Date(),
        });

        res.status(500).json({ message: "Lỗi xóa Admin", error: error.message });
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

        // 🔍 Kiểm tra sinh viên có tồn tại không trước khi xóa
        const student = await User.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: "Sinh viên không tồn tại!" });
        }

        // 🗑️ Xóa sinh viên
        await User.findByIdAndDelete(studentId);

        // ✅ Lưu log xóa sinh viên
        await Log.create({
            user_id: req.user.id, // Người thực hiện hành động
            action: "Xóa sinh viên",
            description: `Admin ${req.user.id} đã xóa sinh viên ${studentId} (${student.name})`,
            timestamp: new Date(),
        });

        res.json({ message: `Sinh viên ${student.name} đã bị xóa` });
    } catch (error) {
        console.error("❌ Lỗi xóa sinh viên:", error);

        // ❌ Lưu log lỗi
        await Log.create({
            user_id: req.user ? req.user.id : null,
            action: "Lỗi",
            description: `Lỗi khi xóa sinh viên: ${error.message}`,
            timestamp: new Date(),
        });

        res.status(500).json({ message: "Lỗi xóa sinh viên", error: error.message });
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

         // ✅ Lưu log tạo hoạt động
         await Log.create({
            user_id: req.user.id,
            action: "Tạo hoạt động",
            description: `Người dùng ${req.user.id} đã tạo hoạt động ${newActivity._id} (${name})`,
            timestamp: new Date(),
        });


        res.status(201).json({
            message: "Hoạt động đã được tạo",
            activity: newActivity
        });
    } catch (error) {
        console.error("❌ Lỗi tạo hoạt động:", error);

         // ❌ Lưu log lỗi
         await Log.create({
            user_id: req.user ? req.user.id : null,
            action: "Lỗi",
            description: `Lỗi khi tạo hoạt động: ${error.message}`,
            timestamp: new Date(),
        });


        res.status(500).json({ message: "Lỗi tạo hoạt động", error: error.message });
    }
};




export const deleteActivity = async (req, res) => {
    try {
        const activityId = req.params.activityId.trim();

        if (!mongoose.Types.ObjectId.isValid(activityId)) {
            return res.status(400).json({ message: "ID hoạt động không hợp lệ!" });
        }

        // 🔍 Tìm hoạt động trước khi xóa
        const activity = await Activity.findById(activityId);
        if (!activity) {
            return res.status(404).json({ message: "Hoạt động không tồn tại!" });
        }

        // 🗑️ Xóa hoạt động
        await Activity.findByIdAndDelete(activityId);

        // ✅ Lưu log xóa hoạt động
        await Log.create({
            user_id: req.user.id,
            action: "Xóa hoạt động",
            description: `Người dùng ${req.user.id} đã xóa hoạt động ${activityId} (${activity.name})`,
            timestamp: new Date(),
        });

        res.json({ message: "Hoạt động đã bị xóa" });
    } catch (error) {
        console.error("❌ Lỗi xóa hoạt động:", error);

        // ❌ Lưu log lỗi
        await Log.create({
            user_id: req.user ? req.user.id : null,
            action: "Lỗi",
            description: `Lỗi khi xóa hoạt động: ${error.message}`,
            timestamp: new Date(),
        });

        res.status(500).json({ message: "Lỗi xóa hoạt động", error: error.message });
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
export const checkInActivity = async (req, res) => {
    try {
        const { studentId, activityId } = req.body;
        const adminId = req.user ? req.user.id : null; // Lấy ID người thực hiện

        // Kiểm tra dữ liệu đầu vào
        if (!studentId || !activityId) {
            return res.status(400).json({ message: "Thiếu thông tin điểm danh!" });
        }

        // Kiểm tra sinh viên có tồn tại không
        const student = await User.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: "Sinh viên không tồn tại!" });
        }

        // Kiểm tra hoạt động có tồn tại không
        const activity = await Activity.findById(activityId);
        if (!activity) {
            return res.status(404).json({ message: "Hoạt động không tồn tại!" });
        }

        // Kiểm tra sinh viên đã điểm danh chưa
        const existingRecord = await AttendanceRecord.findOne({ student_id: studentId, activity_id: activityId });
        if (existingRecord) {
            return res.status(400).json({ message: "Sinh viên đã điểm danh hoạt động này!" });
        }

        // Tạo bản ghi điểm danh
        const newRecord = await AttendanceRecord.create({
            student_id: studentId,
            activity_id: activityId,
            status: "present",
            timestamp: new Date(),
            created_by: adminId, // Lưu admin nào đã điểm danh cho sinh viên
        });

        // Lưu log điểm danh
        await Log.create({
            user_id: adminId, // Lưu người thực hiện
            action: "Điểm danh sinh viên",
            description: `Admin ${adminId} đã điểm danh sinh viên ${studentId} vào hoạt động ${activityId}`,
            timestamp: new Date(),
        });

        res.status(201).json({ message: "Điểm danh thành công!", record: newRecord });
    } catch (error) {
        console.error("❌ Lỗi điểm danh:", error);

        // Lưu log lỗi
        await Log.create({
            user_id: req.user ? req.user.id : null,
            action: "Lỗi",
            description: `Lỗi khi điểm danh: ${error.message}`,
            timestamp: new Date(),
        });

        res.status(500).json({ message: "Lỗi điểm danh", error: error.message });
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

