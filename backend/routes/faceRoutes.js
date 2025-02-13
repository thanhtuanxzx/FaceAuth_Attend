import express from "express";
import { verifyFace, trainFaces } from "../controllers/faceController.js";
import multer from "multer";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// Nhận diện khuôn mặt
router.post("/verify", upload.single("image"), verifyFace);

// Train dữ liệu mới
router.post("/train", upload.array("image", 20), trainFaces);

export default router;
