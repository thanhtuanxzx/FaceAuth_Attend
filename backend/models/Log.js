import mongoose from "mongoose";

const LogSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false }, // Ai thao tác
    action: { type: String, required: true }, // Nội dung thao tác (VD: "Tạo hoạt động", "Xóa hoạt động")
    description: { type: String }, // Mô tả chi tiết hơn về thao tác
    created_at: { type: Date, default: Date.now }
});

const Log = mongoose.model("Log", LogSchema);
export default Log;
