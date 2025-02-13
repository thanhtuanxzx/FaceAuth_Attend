import mongoose from "mongoose";

const AttendanceRecordSchema = new mongoose.Schema({
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Sinh viên
    activity_id: { type: mongoose.Schema.Types.ObjectId, ref: "Activity", required: true }, // Hoạt động
    status: { type: String, enum: ["present", "absent"], required: true },
    timestamp: { type: Date, default: Date.now },
    created_at: { type: Date, default: Date.now }
});

const AttendanceRecord = mongoose.model("AttendanceRecord", AttendanceRecordSchema);
export default AttendanceRecord;
