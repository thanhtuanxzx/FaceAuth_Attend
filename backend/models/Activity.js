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
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Admin tạo hoạt động
    created_at: { type: Date, default: Date.now }
});

const Activity = mongoose.model("Activity", ActivitySchema);
export default Activity;
