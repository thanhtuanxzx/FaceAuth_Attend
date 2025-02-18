import Evaluation from "../models/Evaluation.js";
import updateEvaluationScore from "../services/updateEvaluationScore.js";

export const updateEvaluation = async (req, res) => {
  try {
    const { userId } = req.params;
    const { semester } = req.body; // Học kỳ cần cập nhật
    await updateEvaluationScore(userId, semester);

    return res.status(200).json({ message: "Cập nhật điểm rèn luyện thành công!" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getEvaluation = async (req, res) => {
  try {
    const { userId } = req.params;
    const evaluation = await Evaluation.findOne({ user_id: userId });

    if (!evaluation) {
      return res.status(404).json({ message: "Không tìm thấy điểm rèn luyện." });
    }

    return res.status(200).json(evaluation);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
export default updateEvaluationScore;
