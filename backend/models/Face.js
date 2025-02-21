import mongoose from "mongoose";

const FaceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  faceData: { type: [Number], required: true }, // Embeddings từ khuôn mặt
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Face", FaceSchema);
