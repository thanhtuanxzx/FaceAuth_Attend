import mongoose from "mongoose";

const EvaluationSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  semester: { type: String, required: true },
  criteria: { type: Map, of: Object, default: {} },
  total_score: { type: Number, default: 0 },
});

const Evaluation = mongoose.model("Evaluation", EvaluationSchema);
export default Evaluation;
