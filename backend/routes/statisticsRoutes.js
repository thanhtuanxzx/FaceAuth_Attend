import express from "express";
import {
    getOverviewStatistics,
    getActivityStatistics,
    getStudentStatistics,
    getDateStatistics,
    exportStatisticsToExcel ,
    exportPDFConfirmation
} from "../controllers/statisticsController.js";

import { authenticateUser, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// 🏆 Thống kê tổng quan
router.get("/overview", authenticateUser, authorizeRoles("super_admin", "admin"), getOverviewStatistics);

// 🎯 Thống kê hoạt động
router.get("/activities", authenticateUser, authorizeRoles("super_admin", "admin"), getActivityStatistics);

// 👨‍🎓 Thống kê sinh viên
router.get("/students", authenticateUser, authorizeRoles("super_admin", "admin"), getStudentStatistics);

// 📆 Thống kê theo năm/tháng/ngày
router.get("/date", authenticateUser, authorizeRoles("super_admin", "admin"), getDateStatistics);

router.get("/export-excel",  exportStatisticsToExcel);
router.get("/export-pdf/:student_id",  exportPDFConfirmation);
export default router;
