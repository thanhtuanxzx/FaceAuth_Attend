import mongoose from "mongoose";

const ActivitySchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    date: { type: Date, required: true },
    locations: [
        {
            lat: Number,
            lon: Number,
            radius: Number, // Bán kính cho phép điểm danh (m)
        },
    ],
    isLocked: { type: Boolean, default: false },
    // type: String, // Ví dụ: "club", "volunteer", "sport"
    type: { type: String, enum: ["political", "social", "sports", "volunteer", "other"], required: true }, // Loại hoạt động
    level: { type: String, enum: ["school", "city", "national"], default: "school" }, // Cấp tổ chức hoạt động
    category: { type: [String], enum: ["1b", "3a", "3b", "3c","5a","5b","5c"], required: true },
    // award: { type: String, enum: ["Nhất", "Nhì", "Ba", "None"], default: "None" }, // Giải thưởng nếu có
    // specialRecognition: { type: String, enum: ["Đảng viên", "Đoàn viên ưu tú", "None"], default: "None" }, // Danh hiệu đặc biệt
    group: { type: mongoose.Schema.Types.ObjectId, ref: "GroupAdmin" },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Admin tạo hoạt động
    created_at: { type: Date, default: Date.now }
});

const Activity = mongoose.model("Activity", ActivitySchema);
export default Activity;
