import mongoose from "mongoose";

const DisciplinaryRecordSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["warning", "discipline"], required: true }, // warning = cảnh cáo, discipline = kỷ luật
  reason: { type: String, required: true },
  date: { type: Date, default: Date.now }
});

// ✅ Sửa lỗi: Đổi tên biến khi khai báo model
const DisciplinaryRecord = mongoose.model("DisciplinaryRecord", DisciplinaryRecordSchema);
export default DisciplinaryRecord;
