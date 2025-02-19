import express from "express";
import DisciplinaryRecord from "../models/DisciplinaryRecord.js";
import { getEvaluation,updateEvaluation } from "../controllers/evaluationController.js";
const router = express.Router();

/* 📌 CẬP NHẬT ĐIỂM RÈN LUYỆN */
router.post("/update/:userId",updateEvaluation);

router.get("/:userId", getEvaluation);


/* 📌 THÊM BẢN GHI KỶ LUẬT */
router.post("/disciplinary", async (req, res) => {
  try {
    const { user_id, type, reason } = req.body;
    const newRecord = await DisciplinaryRecord.create({ user_id, type, reason });
    res.json({ message: "Đã thêm bản ghi kỷ luật!", record: newRecord });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi thêm bản ghi kỷ luật!", error: error.message });
  }
});

/* 📌 LẤY DANH SÁCH KỶ LUẬT */
router.get("/disciplinary/:userId", async (req, res) => {
  try {
    const records = await DisciplinaryRecord.find({ user_id: req.params.userId });
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách kỷ luật!", error: error.message });
  }
});

/* 📌 CẬP NHẬT LÝ DO KỶ LUẬT */
router.put("/disciplinary/:recordId", async (req, res) => {
  try {
    const updatedRecord = await DisciplinaryRecord.findByIdAnevaluationdUpdate(
      req.params.recordId,
      { reason: req.body.reason },
      { new: true }
    );
    res.json({ message: "Đã cập nhật lý do kỷ luật!", updatedRecord });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi cập nhật!", error: error.message });
  }
});

/* 📌 XÓA BẢN GHI KỶ LUẬT */
router.delete("/disciplinary/:recordId", async (req, res) => {
  try {
    await DisciplinaryRecord.findByIdAndDelete(req.params.recordId);
    res.json({ message: "Đã xóa bản ghi kỷ luật!" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi xóa!", error: error.message });
  }
});

export default router;
