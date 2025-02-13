import mongoose from "mongoose";

const LogSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Ai thao tác
    action: { type: String, required: true }, // Nội dung thao tác
    timestamp: { type: Date, default: Date.now },
    created_at: { type: Date, default: Date.now }
});

const Log = mongoose.model("Log", LogSchema);
export default Log;
