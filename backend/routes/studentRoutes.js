import express from "express";
import studentController from "../controllers/studentController.js";
import { authenticateUser, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// 📌 Sinh viên điểm danh (KHÔNG cần xác thực khuôn mặt)
router.post("/attendance", authenticateUser, authorizeRoles("student"), studentController.markAttendance);

// 📌 Xem lịch sử điểm danh
router.get("/attendance/history", authenticateUser, authorizeRoles("student"), studentController.getAttendanceHistory);

// 📌 Xem chi tiết một lần điểm danh
router.get("/attendance/:id", authenticateUser, authorizeRoles("student"), studentController.getAttendanceById);
router.get("/profile", authenticateUser,studentController.getUserProfile);

export default router;
