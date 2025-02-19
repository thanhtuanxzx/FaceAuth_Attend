import User from "../models/User.js";
import Activity from "../models/Activity.js";
import AttendanceRecord from "../models/AttendanceRecord.js";
import Log from "../models/Log.js";
import bcrypt from "bcrypt";
import mongoose from "mongoose";

export const updateStudentInfo = async (req, res) => {
    try {
        // Lấy dữ liệu từ request
        const { userId, gpa, specialRecognition, awards } = req.body;
        if (!userId) throw new Error("Thiếu thông tin userId!");

        // Tìm sinh viên
        const user = await User.findById(userId);
        if (!user) throw new Error("Sinh viên không tồn tại!");

        let isUpdated = false;

        // Cập nhật GPA
        if (gpa !== undefined && !isNaN(gpa) && gpa >= 0 && gpa <= 4) {
            if (user.gpa !== gpa) {
                user.gpa = gpa;
                isUpdated = true;
            }
        }

        // Cập nhật danh hiệu đặc biệt
        if (specialRecognition && ["Đảng viên", "Đoàn viên ưu tú", "None"].includes(specialRecognition)) {
            if (user.specialRecognition !== specialRecognition) {
                user.specialRecognition = specialRecognition;
                isUpdated = true;
            }
        }

        // Cập nhật giải thưởng (thêm mới nhưng không trùng lặp)
        if (Array.isArray(awards)) {
            const validAwards = ["Nhất", "Nhì", "Ba", "other"];
            const newAwards = awards.filter(award => validAwards.includes(award) && !user.awards.includes(award));
        
            if (newAwards.length > 0) {
                user.awards.push(...newAwards);
                isUpdated = true;
            }
        }
        

        // Chỉ lưu nếu có thay đổi
        if (isUpdated) {
            await user.save();
            console.log(`✅ Cập nhật thông tin sinh viên ${user.name} thành công!`);
            res.status(200).json({ message: "Cập nhật thành công!", user });
        } else {
            console.log(`⚠️ Không có thay đổi nào đối với sinh viên ${user.name}.`);
            res.status(200).json({ message: "Không có thay đổi nào." });
        }
    } catch (error) {
        console.error("❌ Lỗi khi cập nhật thông tin sinh viên:", error.message);
        res.status(400).json({ error: error.message });
    }
};

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

        res.status(201).json({status:201, message: "Admin đã được tạo", admin: newAdmin });
    } catch (error) {
        res.status(500).json({ status:500,message: "Lỗi tạo Admin", error });
    }
};

// ✅ 2️⃣ Xóa tài khoản Admin
export const deleteAdmin = async (req, res) => {
    try {
        const { adminId } = req.params;

        // 🔍 Kiểm tra admin có tồn tại không trước khi xóa
        const admin = await User.findById(adminId);
        if (!admin) {
            return res.status(404).json({status:404, message: "Admin không tồn tại!" });
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

        res.json({status:200, message: `Admin ${admin.name} đã bị xóa` });
    } catch (error) {
        console.error("❌ Lỗi xóa Admin:", error);

        // ❌ Lưu log lỗi
        await Log.create({
            user_id: req.user ? req.user.id : null,
            action: "Lỗi",
            description: `Lỗi khi xóa Admin: ${error.message}`,
            timestamp: new Date(),
        });

        res.status(500).json({status:500, message: "Lỗi xóa Admin", error: error.message });
    }
};

// ✅ 3️⃣ Lấy danh sách Admin
export const getAllAdmins = async (req, res) => {
    try {
        const admins = await User.find({ role: "admin" });
        res.json({status:200,admins});
    } catch (error) {
        res.status(500).json({status:500, message: "Lỗi lấy danh sách Admin", error });
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

        res.status(201).json({ status:200,message: "Sinh viên đã được tạo", student: newStudent });
    } catch (error) {
        res.status(500).json({ status:500,message: "Lỗi tạo sinh viên", error });
    }
};

export const deleteStudent = async (req, res) => {
    try {
        const { studentId } = req.params;

        // 🔍 Kiểm tra sinh viên có tồn tại không trước khi xóa
        const student = await User.findById(studentId);
        if (!student) {
            return res.status(404).json({status:404, message: "Sinh viên không tồn tại!" });
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

        res.json({status:200, message: `Sinh viên ${student.name} đã bị xóa` });
    } catch (error) {
        console.error("❌ Lỗi xóa sinh viên:", error);

        // ❌ Lưu log lỗi
        await Log.create({
            user_id: req.user ? req.user.id : null,
            action: "Lỗi",
            description: `Lỗi khi xóa sinh viên: ${error.message}`,
            timestamp: new Date(),
        });

        res.status(500).json({status:500, message: "Lỗi xóa sinh viên", error: error.message });
    }
};

export const getAllStudents = async (req, res) => {
    try {
        const students = await User.find({ role: "student" });
        res.json({status:200,students});
    } catch (error) {
        res.status(500).json({ status:200,message: "Lỗi lấy danh sách sinh viên", error });
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
        const { name, description, date, locations ,type,level,category} = req.body;

        // Kiểm tra quyền tạo hoạt động
        if (!req.user || !req.user.id) {
            return res.status(403).json({ status:403,message: "Bạn không có quyền tạo hoạt động!" });
        }

        // Kiểm tra danh sách địa điểm
        if (!Array.isArray(locations) || locations.length === 0) {
            return res.status(400).json({status:400, message: "Hoạt động cần có ít nhất một địa điểm!" });
        }

        // Kiểm tra từng địa điểm có lat, lon, radius không
        for (const location of locations) {
            if (!location.lat || !location.lon || !location.radius) {
                return res.status(400).json({status:400, message: "Mỗi địa điểm phải có lat, lon và radius!" });
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
            type, 
            level,
            category,
            created_by: req.user.id,
        });

         // ✅ Lưu log tạo hoạt động
         await Log.create({
            user_id: req.user.id,
            action: "Tạo hoạt động",
            description: `Người dùng ${req.user.id} đã tạo hoạt động ${newActivity._id} (${name})`,
            timestamp: new Date(),
        });


        res.status(201).json({status:201,
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


        res.status(500).json({status:500, message: "Lỗi tạo hoạt động", error: error.message });
    }
};




export const deleteActivity = async (req, res) => {
    try {
        const activityId = req.params.activityId.trim();

        if (!mongoose.Types.ObjectId.isValid(activityId)) {
            return res.status(400).json({status:400, message: "ID hoạt động không hợp lệ!" });
        }

        // 🔍 Tìm hoạt động trước khi xóa
        const activity = await Activity.findById(activityId);
        if (!activity) {
            return res.status(404).json({status:404, message: "Hoạt động không tồn tại!" });
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

        res.json({status:200, message: "Hoạt động đã bị xóa" });
    } catch (error) {
        console.error("❌ Lỗi xóa hoạt động:", error);

        // ❌ Lưu log lỗi
        await Log.create({
            user_id: req.user ? req.user.id : null,
            action: "Lỗi",
            description: `Lỗi khi xóa hoạt động: ${error.message}`,
            timestamp: new Date(),
        });

        res.status(500).json({ status:500,message: "Lỗi xóa hoạt động", error: error.message });
    }
};


export const getAllActivities = async (req, res) => {
    try {
        const activities = await Activity.find();
        res.json(activities);
    } catch (error) {
        res.status(500).json({ status:500,message: "Lỗi lấy danh sách hoạt động", error });
    }
};
export const toggleLockActivity = async (req, res) => {
    try {
        const activityId = req.params.activityId.trim();

        if (!mongoose.Types.ObjectId.isValid(activityId)) {
            return res.status(400).json({ status:400,message: "ID hoạt động không hợp lệ!" });
        }

        // 🔍 Tìm hoạt động
        const activity = await Activity.findById(activityId);
        if (!activity) {
            return res.status(404).json({ status:404,message: "Hoạt động không tồn tại!" });
        }

        // 🔄 Chuyển đổi trạng thái khóa
        activity.isLocked = !activity.isLocked;
        await activity.save();

        // ✅ Lưu log thay đổi trạng thái
        await Log.create({
            user_id: req.user.id,
            action: activity.isLocked ? "Khóa hoạt động" : "Mở khóa hoạt động",
            description: `Người dùng ${req.user.id} đã ${activity.isLocked ? "khóa" : "mở khóa"} hoạt động ${activityId} (${activity.name})`,
            timestamp: new Date(),
        });

        res.json({status:200,
            message: `Hoạt động đã được ${activity.isLocked ? "khóa" : "mở khóa"}`,
            activity,
        });
    } catch (error) {
        console.error("❌ Lỗi thay đổi trạng thái khóa hoạt động:", error);

        // ❌ Lưu log lỗi
        await Log.create({
            user_id: req.user ? req.user.id : null,
            action: "Lỗi",
            description: `Lỗi khi thay đổi trạng thái khóa hoạt động: ${error.message}`,
            timestamp: new Date(),
        });

        res.status(500).json({status:500, message: "Lỗi thay đổi trạng thái khóa hoạt động", error: error.message });
    }
};


// ✅ 6️⃣ Lấy danh sách điểm danh của sinh viên
export const getAttendanceRecords = async (req, res) => {
    try {
        const records = await AttendanceRecord.find().populate("student_id activity_id");
        res.json({status:200,records});
    } catch (error) {
        res.status(500).json({ status:500,message: "Lỗi lấy danh sách điểm danh", error });
    }
};
export const checkInActivity = async (req, res) => {
    try {
        const { studentIds, activityId } = req.body; // Chấp nhận nhiều studentIds
        const adminId = req.user ? req.user.id : null; // Lấy ID người thực hiện

        // Kiểm tra dữ liệu đầu vào
        if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0 || !activityId) {
            return res.status(400).json({ status: 400, message: "Thiếu thông tin điểm danh hoặc danh sách sinh viên không hợp lệ!" });
        }

        // Kiểm tra hoạt động có tồn tại không
        const activity = await Activity.findById(activityId);
        if (!activity) {
            return res.status(404).json({ status: 404, message: "Hoạt động không tồn tại!" });
        }

        // Tìm tất cả sinh viên trong danh sách
        const students = await User.find({ _id: { $in: studentIds } });
        if (students.length !== studentIds.length) {
            return res.status(404).json({ status: 404, message: "Một hoặc nhiều sinh viên không tồn tại!" });
        }

        const attendanceRecords = [];
        const logEntries = [];
        const alreadyCheckedIn = [];

        for (const studentId of studentIds) {
            // Kiểm tra sinh viên đã điểm danh chưa
            const existingRecord = await AttendanceRecord.findOne({ student_id: studentId, activity_id: activityId });
            if (existingRecord) {
                alreadyCheckedIn.push(studentId);
                continue; // Bỏ qua sinh viên đã điểm danh
            }

            // Tạo bản ghi điểm danh mới
            attendanceRecords.push({
                student_id: studentId,
                activity_id: activityId,
                status: "present",
                timestamp: new Date(),
                created_by: adminId,
            });

            // Tạo log điểm danh
            logEntries.push({
                user_id: adminId,
                action: "Điểm danh sinh viên",
                description: `Admin ${adminId} đã điểm danh sinh viên ${studentId} vào hoạt động ${activityId}`,
                timestamp: new Date(),
            });
        }

        // Lưu tất cả bản ghi điểm danh và log
        if (attendanceRecords.length > 0) {
            await AttendanceRecord.insertMany(attendanceRecords);
            await Log.insertMany(logEntries);
        }

        // Kết quả phản hồi
        res.status(201).json({
            status: 201,
            message: "Điểm danh thành công!",
            alreadyCheckedIn,
            newRecords: attendanceRecords,
        });
    } catch (error) {
        console.error("❌ Lỗi điểm danh:", error);

        // Lưu log lỗi
        await Log.create({
            user_id: req.user ? req.user.id : null,
            action: "Lỗi",
            description: `Lỗi khi điểm danh: ${error.message}`,
            timestamp: new Date(),
        });

        res.status(500).json({ status: 500, message: "Lỗi điểm danh", error: error.message });
    }
};

// export const updateUserAchievements = async (userId, activityId) => {
//     try {
//         const activity = await Activity.findById(activityId);
//         if (!activity) throw new Error("Hoạt động không tồn tại!");

//         const user = await User.findById(userId);
//         if (!user) throw new Error("Sinh viên không tồn tại!");

//         // Nếu hoạt động có danh hiệu đặc biệt, cập nhật cho User
//         if (activity.specialRecognition && activity.specialRecognition !== "None") {
//             user.specialRecognition = activity.specialRecognition;
//         }

//         // Nếu hoạt động có giải thưởng, thêm vào danh sách của User
//         if (activity.award && activity.award !== "None" && !user.awards.includes(activity.award)) {
//             user.awards.push(activity.award);
//         }

//         await user.save();
//         console.log(`✅ Cập nhật danh hiệu & giải thưởng cho sinh viên ${user.name} thành công!`);
//     } catch (error) {
//         console.error("❌ Lỗi khi cập nhật thành tích sinh viên:", error.message);
//     }
// };





// ✅ 7️⃣ Xem log hệ thống
export const getSystemLogs = async (req, res) => {
    try {
        const logs = await Log.find().populate("user_id");
        res.json({status:200,logs});
    } catch (error) {
        res.status(500).json({status:500,message: "Lỗi lấy log hệ thống", error });
    }
};

