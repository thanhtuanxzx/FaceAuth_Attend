import express from "express";
import { verifyFace, trainFaces ,saveFaceData, getFaceData  } from "../controllers/faceController.js";
import multer from "multer";
import { authenticateUser, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// Nhận diện khuôn mặt
router.post("/verify", upload.single("image"), verifyFace);

// Train dữ liệu mới
router.post("/train",authenticateUser, upload.array("image", 20), trainFaces);
router.post("/train-faces",authenticateUser, saveFaceData);  // Gửi dữ liệu khuôn mặt
router.get("/faces/:studentId", getFaceData);  // Lấy dữ liệu khuôn mặt theo studentId
export default router;
