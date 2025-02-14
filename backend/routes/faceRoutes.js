import express from "express";
import { verifyFace, trainFaces } from "../controllers/faceController.js";
import multer from "multer";
import { authenticateUser, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// Nhận diện khuôn mặt
router.post("/verify", upload.single("image"), verifyFace);

// Train dữ liệu mới
router.post("/train",authenticateUser, upload.array("image", 20), trainFaces);

export default router;
