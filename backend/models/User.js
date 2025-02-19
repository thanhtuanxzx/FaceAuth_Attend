import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true,trim: true,unique: true },
    password: { type: String, required: true },
    isVerified: { type: Boolean, default: false } ,
    role: { type: String, enum: ["super_admin", "admin", "student"], required: true },
    studentId: { type: String, unique: true, sparse: true }, // Mã số sinh viên
    classCode: { type: String }, // Mã lớp
    major: { type: String }, // Ngành học
    gpa: { type: Number, default: 0 }, // Điểm trung bình tích lũy
    specialRecognition: { type: String, enum: ["Đảng viên", "Đoàn viên ưu tú", "None"], default: "None" }, // Danh hiệu đặc biệt
    awards: [{ type: String, enum: ["Nhất", "Nhì", "Ba","other"] }], // Giải thưởng (có thể có nhiều)
    created_at: { type: Date, default: Date.now }
});

const User = mongoose.model("User", UserSchema);
export default User;
