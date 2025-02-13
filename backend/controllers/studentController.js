import AttendanceRecord from "../models/AttendanceRecord.js";
import Activity from "../models/Activity.js";

export const markAttendance = async (req, res) => {
    try {
        const { activity_id } = req.body;
        console.log("Request User:", req.user); // 🛠 Log kiểm tra

        const student_id = req.user.id; // 🛠 Đổi từ _id sang id
        console.log("Student ID:", student_id); // 🛠 Log ID để kiểm tra

        if (!student_id) {
            return res.status(400).json({ message: "Thiếu student_id từ token!" });
        }

        const activity = await Activity.findById(activity_id);
        if (!activity) {
            return res.status(404).json({ message: "Hoạt động không tồn tại!" });
        }

        const existingRecord = await AttendanceRecord.findOne({ student_id, activity_id });
        if (existingRecord) {
            return res.status(400).json({ message: "Bạn đã điểm danh trước đó!" });
        }

        const attendance = await AttendanceRecord.create({
            student_id,
            activity_id,
            status: "present",
            timestamp: new Date(),
        });

        res.status(201).json({ message: "Điểm danh thành công!", attendance });
    } catch (error) {
        res.status(500).json({ message: "Lỗi điểm danh", error });
    }
};


export const getAttendanceHistory = async (req, res) => {
    try {
        const student_id = req.user.id;

        const history = await AttendanceRecord.find({ student_id })
            .populate("activity_id", "name date")
            .sort({ timestamp: -1 });

        res.status(200).json({ history });
    } catch (error) {
        res.status(500).json({ message: "Lỗi lấy lịch sử điểm danh", error });
    }
};

export const getAttendanceById = async (req, res) => {
    try {
        const { id } = req.params;
        const record = await AttendanceRecord.findById(id).populate("activity_id", "name date");

        if (!record) {
            return res.status(404).json({ message: "Không tìm thấy bản ghi điểm danh!" });
        }

        res.status(200).json({ record });
    } catch (error) {
        res.status(500).json({ message: "Lỗi lấy dữ liệu điểm danh", error });
    }
};
export default {
    markAttendance,
    getAttendanceHistory,
    getAttendanceById,
};
