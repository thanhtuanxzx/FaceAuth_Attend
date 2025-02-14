import User from "../models/User.js";
import Activity from "../models/Activity.js";
import AttendanceRecord from "../models/AttendanceRecord.js";
import ExcelJS from "exceljs";
import path from "path";
import XLSX from "xlsx";
import fs from "fs";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const fontkit = require("fontkit");

import { PDFDocument, rgb } from "pdf-lib";
// import { generateClubConfirmation } from "../utils/wordGenerator.js";
/**
 * 📌 Thống kê tổng quan hệ thống
 */
export const getOverviewStatistics = async (req, res) => {
    try {
        const totalAdmins = await User.countDocuments({ role: "admin" });
        const totalStudents = await User.countDocuments({ role: "student" });
        const totalActivities = await Activity.countDocuments();
        const totalCheckIns = await AttendanceRecord.countDocuments();

        res.json({
            message: "Thống kê tổng quan hệ thống",
            totalAdmins,
            totalStudents,
            totalActivities,
            totalCheckIns
        });
    } catch (error) {
        res.status(500).json({ message: "Lỗi thống kê tổng quan", error: error.message });
    }
};

/**
 * 📌 Thống kê số lần điểm danh theo hoạt động
 */
export const getActivityStatistics = async (req, res) => {
    try {
        const activityStats = await AttendanceRecord.aggregate([
            {
                $group: {
                    _id: { $toObjectId: "$activity_id" }, // Chuyển thành ObjectId nếu cần
                    checkInCount: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: "activities", // Kiểm tra đúng tên collection
                    localField: "_id",
                    foreignField: "_id",
                    as: "activityInfo"
                }
            },
            { $unwind: "$activityInfo" },
            {
                $project: {
                    activity_id: "$_id",
                    activity_name: "$activityInfo.name",
                    checkInCount: 1
                }
            }
        ]);

        return res.status(200).json({
            success: true,
            message: "Thống kê hoạt động thành công",
            data: activityStats
        });

    } catch (error) {
        console.error("Lỗi thống kê hoạt động:", error);
        return res.status(500).json({
            success: false,
            message: "Lỗi thống kê hoạt động",
            error: error.message
        });
    }
};

/**
 * 📌 Thống kê số lần điểm danh theo sinh viên
 */
export const getStudentStatistics = async (req, res) => {
    try {
        const studentStats = await AttendanceRecord.aggregate([
            { $group: { _id: "$student_id", checkInCount: { $sum: 1 } } },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "studentInfo"
                }
            },
            { $unwind: "$studentInfo" },
            {
                $project: {
                    student_id: "$_id",
                    student_name: "$studentInfo.name",
                    checkInCount: 1
                }
            }
        ]);

        res.json({ message: "Thống kê sinh viên", studentStats });
    } catch (error) {
        res.status(500).json({ message: "Lỗi thống kê sinh viên", error: error.message });
    }
};

/**
 * 📌 Thống kê theo năm/tháng/ngày
 */
export const getDateStatistics = async (req, res) => {
    try {
        const { type, value } = req.query; // "year", "month", "day"

        let startDate, endDate;
        if (type === "year") {
            startDate = new Date(`${value}-01-01T00:00:00.000Z`);
            endDate = new Date(`${value}-12-31T23:59:59.999Z`);
        } else if (type === "month") {
            startDate = new Date(`${value}-01T00:00:00.000Z`);
            const [year, month] = value.split("-");
            endDate = new Date(year, month, 0, 23, 59, 59, 999); // Lấy ngày cuối tháng
        } else if (type === "day") {
            startDate = new Date(`${value}T00:00:00.000Z`);
            endDate = new Date(`${value}T23:59:59.999Z`);
        } else {
            return res.status(400).json({ message: "Loại thống kê không hợp lệ" });
        }

        const dateStats = await AttendanceRecord.aggregate([
            { $match: { createdAt: { $gte: startDate, $lt: endDate } } },
            { $group: { _id: null, totalCheckIns: { $sum: 1 } } }
        ]);

        res.json({ message: `Thống kê theo ${type}`, totalCheckIns: dateStats[0]?.totalCheckIns || 0 });
    } catch (error) {
        res.status(500).json({ message: "Lỗi thống kê theo ngày/tháng/năm", error: error.message });
    }
};



// export const exportStatisticsToExcel = async (req, res) => {
//     try {
//         // Lấy dữ liệu điểm danh
//         const attendanceRecords = await AttendanceRecord.find().populate("student_id activity_id");

//         // Chuyển dữ liệu thành định dạng Excel
//         const data = attendanceRecords.map(record => ({
//             "Tên Sinh Viên": record.student_id?.name || "Không có dữ liệu",
//             "Mã Sinh Viên": record.student_id?._id ? record.student_id._id.toString() : "Không có dữ liệu",
//             "Tên Hoạt Động": record.activity_id?.name || "Không có dữ liệu",
//             "Thời Gian Điểm Danh": record.createdAt ? new Date(record.createdAt).toISOString() : "Không có dữ liệu",
//         }));

//         console.log("📊 Dữ liệu thống kê điểm danh:", JSON.stringify(data, null, 2));

//         // Tạo workbook và sheet
//         const wb = XLSX.utils.book_new();
//         const ws = XLSX.utils.json_to_sheet(data);
//         XLSX.utils.book_append_sheet(wb, ws, "Thống kê Điểm Danh");

//         // Tạo folder exports nếu chưa tồn tại
//         const exportDir = path.join(process.cwd(), "exports");
//         if (!fs.existsSync(exportDir)) {
//             fs.mkdirSync(exportDir, { recursive: true });
//             console.log("📁 Tạo thư mục exports");
//         }

//         // Lưu file Excel
//         const filePath = path.join(exportDir, `thong_ke_${Date.now()}.xlsx`);
//         XLSX.writeFile(wb, filePath);
//         console.log(`✅ File Excel đã được tạo: ${filePath}`);

//         // Trả file về client
//         res.download(filePath, "thong_ke.xlsx", err => {
//             if (err) {
//                 console.error("❌ Lỗi tải file:", err.message);
//                 return res.status(500).json({ message: "Lỗi tải file", error: err.message });
//             }
//             console.log("📤 File đã được gửi về client!");

//             // Xóa file sau khi tải để tránh lưu trữ không cần thiết
//             setTimeout(() => {
//                 fs.unlinkSync(filePath);
//                 console.log(`🗑️ File đã bị xóa: ${filePath}`);
//             }, 50000);
//         });

//     } catch (error) {
//         console.error("❌ Lỗi xuất thống kê Excel:", error);
//         res.status(500).json({ message: "Lỗi xuất thống kê Excel", error: error.message });
//     }
// };


// export const exportStatisticsToExcel = async (req, res) => {
//     try {
//         // Lấy dữ liệu điểm danh + thông tin sinh viên + thông tin hoạt động
//         const attendanceRecords = await AttendanceRecord.find()
//             .populate({
//                 path: "student_id",
//                 select: "name studentId classCode major",
//             })
//             .populate({
//                 path: "activity_id",
//                 select: "name date",
//             });

//         // Chuyển dữ liệu thành định dạng Excel
//         const data = attendanceRecords.map(record => ({
//             "Tên Sinh Viên": record.student_id?.name || "Không có dữ liệu",
//             "Mã Sinh Viên": record.student_id?.studentId || "Không có dữ liệu",
//             "Mã Lớp": record.student_id?.classCode || "Không có dữ liệu",
//             "Ngành Học": record.student_id?.major || "Không có dữ liệu",
//             "Tên Hoạt Động": record.activity_id?.name || "Không có dữ liệu",
//             "Ngày Hoạt Động": record.activity_id?.date
//                 ? new Date(record.activity_id.date).toLocaleDateString("vi-VN")
//                 : "Không có dữ liệu",
//             // "Trạng Thái": record.status === "present" ? "Có mặt" : "Vắng mặt",
//             "Thời Gian Điểm Danh": record.created_at
//                 ? new Date(record.created_at).toLocaleString("vi-VN")
//                 : "Không có dữ liệu",
//         }));

//         console.log("📊 Dữ liệu thống kê điểm danh:", JSON.stringify(data, null, 2));

//         // Tạo workbook và sheet
//         const wb = XLSX.utils.book_new();
//         const ws = XLSX.utils.json_to_sheet(data);
//         XLSX.utils.book_append_sheet(wb, ws, "Thống kê Điểm Danh");

//         // Tạo thư mục nếu chưa tồn tại
//         const exportDir = path.join(process.cwd(), "exports");
//         if (!fs.existsSync(exportDir)) {
//             fs.mkdirSync(exportDir, { recursive: true });
//             console.log("📁 Tạo thư mục exports");
//         }

//         // Lưu file Excel
//         const filePath = path.join(exportDir, `thong_ke_${Date.now()}.xlsx`);
//         XLSX.writeFile(wb, filePath);
//         console.log(`✅ File Excel đã được tạo: ${filePath}`);

//         // Gửi file về client
//         res.download(filePath, "thong_ke.xlsx", err => {
//             if (err) {
//                 console.error("❌ Lỗi tải file:", err.message);
//                 return res.status(500).json({ message: "Lỗi tải file", error: err.message });
//             }
//             console.log("📤 File đã được gửi về client!");

//             // Xóa file sau khi tải
//             setTimeout(() => {
//                 fs.unlinkSync(filePath);
//                 console.log(`🗑️ File đã bị xóa: ${filePath}`);
//             }, 60000); // Xóa sau 60 giây
//         });

//     } catch (error) {
//         console.error("❌ Lỗi xuất thống kê Excel:", error);
//         res.status(500).json({ message: "Lỗi xuất thống kê Excel", error: error.message });
//     }
// };

export const exportStatisticsToExcel = async (req, res) => {
    try {
        const { activity_id } = req.query;

        // Tạo điều kiện lọc
        const filter = activity_id ? { activity_id: activity_id } : {};

        // Lấy dữ liệu điểm danh theo điều kiện
        const attendanceRecords = await AttendanceRecord.find(filter)
            .populate({
                path: "student_id",
                select: "name studentId classCode major",
            })
            .populate({
                path: "activity_id",
                select: "name date",
            });

        if (attendanceRecords.length === 0) {
            return res.status(404).json({ message: "Không có dữ liệu điểm danh!" });
        }

        // Chuyển dữ liệu thành định dạng Excel
        const data = attendanceRecords.map(record => ({
            "Tên Sinh Viên": record.student_id?.name || "Không có dữ liệu",
            "Mã Sinh Viên": record.student_id?.studentId || "Không có dữ liệu",
            "Mã Lớp": record.student_id?.classCode || "Không có dữ liệu",
            "Ngành Học": record.student_id?.major || "Không có dữ liệu",
            "Tên Hoạt Động": record.activity_id?.name || "Không có dữ liệu",
            "Ngày Hoạt Động": record.activity_id?.date
                ? new Date(record.activity_id.date).toLocaleDateString("vi-VN")
                : "Không có dữ liệu",
            // "Trạng Thái": record.status === "present" ? "Có mặt" : "Vắng mặt",
            "Thời Gian Điểm Danh": record.created_at
                ? new Date(record.created_at).toLocaleString("vi-VN")
                : "Không có dữ liệu",
        }));

        console.log("📊 Dữ liệu thống kê điểm danh:", JSON.stringify(data, null, 2));

        // Tạo workbook và sheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, "Thống kê Điểm Danh");

        // Tạo thư mục nếu chưa tồn tại
        const exportDir = path.join(process.cwd(), "exports");
        if (!fs.existsSync(exportDir)) {
            fs.mkdirSync(exportDir, { recursive: true });
            console.log("📁 Tạo thư mục exports");
        }

        // Lưu file Excel
        const filePath = path.join(exportDir, `thong_ke_${Date.now()}.xlsx`);
        XLSX.writeFile(wb, filePath);
        console.log(`✅ File Excel đã được tạo: ${filePath}`);

        // Gửi file về client
        res.download(filePath, "thong_ke.xlsx", err => {
            if (err) {
                console.error("❌ Lỗi tải file:", err.message);
                return res.status(500).json({ message: "Lỗi tải file", error: err.message });
            }
            console.log("📤 File đã được gửi về client!");

            // Xóa file sau khi tải
            setTimeout(() => {
                fs.unlinkSync(filePath);
                console.log(`🗑️ File đã bị xóa: ${filePath}`);
            }, 60000); // Xóa sau 60 giây
        });

    } catch (error) {
        console.error("❌ Lỗi xuất thống kê Excel:", error);
        res.status(500).json({ message: "Lỗi xuất thống kê Excel", error: error.message });
    }
};


// export const exportPDFConfirmation = async (req, res) => {
//     try {
//         const { student_id } = req.params;

//         // 🔍 Lấy thông tin sinh viên
//         const student = { 
//             name: "Nguyễn Văn A",
//             classCode: "CTK44",
//             studentId: "12345678",
//             major: "Công nghệ thông tin"
//         };

//         // 🔍 Lấy danh sách hoạt động
//         const activities = [
//             { name: "Hoạt động tình nguyện", date: "12/12/2024", note: "Hoàn thành tốt" },
//             { name: "Giao lưu văn hóa", date: "20/01/2025", note: "Có mặt" }
//         ];

//         // 📄 Tạo tài liệu PDF
//         const pdfDoc = await PDFDocument.create();
//         pdfDoc.registerFontkit(fontkit); // 📌 Đăng ký fontkit để hỗ trợ font tùy chỉnh

//         const page = pdfDoc.addPage([600, 800]);
//         const { width, height } = page.getSize();

//         // 📥 Nhúng font Unicode 
//         const fontBytes = fs.readFileSync("fonts/font-times-new-roman.ttf");  
//         const customFont = await pdfDoc.embedFont(fontBytes);

//         let y = height - 50;

//         // 📝 Tiêu đề
//         page.drawText("ĐƠN XÁC NHẬN THÀNH VIÊN CLB", { x: 100, y, size: 18, font: customFont, color: rgb(0, 0, 0) });
//         y -= 40;

//         // 🏫 Thông tin sinh viên
//         const studentInfo = [
//             `Họ và Tên: ${student.name}`,
//             `Lớp: ${student.classCode}`,
//             `MSSV: ${student.studentId}`,
//             `Ngành học: ${student.major}`
//         ];
//         studentInfo.forEach(text => {
//             page.drawText(text, { x: 50, y, size: 12, font: customFont });
//             y -= 20;
//         });

//         // 📌 Danh sách hoạt động
//         y -= 30;
//         page.drawText("Danh sách hoạt động đã tham gia:", { x: 50, y, size: 14, font: customFont, color: rgb(0, 0, 1) });
//         y -= 20;

//         activities.forEach((act, index) => {
//             page.drawText(`${index + 1}. ${act.name} - ${act.date} (${act.note})`, { x: 70, y, size: 12, font: customFont });
//             y -= 20;
//         });

//         // 📂 Lưu file PDF
//         const pdfBytes = await pdfDoc.save();
//         const outputPath = path.join("exports", `XacNhan_${student.studentId}.pdf`);
//         fs.writeFileSync(outputPath, pdfBytes);

//         // 📤 Gửi file về client
//         res.download(outputPath, `XacNhan_${student.studentId}.pdf`, err => {
//             if (err) {
//                 console.error("❌ Lỗi tải file:", err.message);
//                 return res.status(500).json({ message: "Lỗi tải file", error: err.message });
//             }
//             console.log(`📤 File PDF đã gửi: ${outputPath}`);

//             // 🗑️ Xóa file sau 60 giây
//             setTimeout(() => {
//                 fs.unlinkSync(outputPath);
//                 console.log(`🗑️ File đã bị xóa: ${outputPath}`);
//             }, 60000);
//         });

//     } catch (error) {
//         console.error("❌ Lỗi xuất file PDF:", error);
//         res.status(500).json({ message: "Lỗi xuất file PDF", error: error.message });
//     }
// };



export const exportPDFConfirmation = async (req, res) => {
    try {
        const { student_id } = req.params;

        // 🔍 Lấy thông tin sinh viên từ DB
        const student = await User.findById(student_id);
        if (!student) {
            return res.status(404).json({ message: "Không tìm thấy sinh viên!" });
        }

        // 🔍 Lấy danh sách hoạt động đã tham gia
        const attendanceRecords = await AttendanceRecord.find({ student_id })
            .populate("activity_id", "name date");

        const activities = attendanceRecords.map((record, index) => ({
            index: index + 1,
            name: record.activity_id?.name || "Không có dữ liệu",
            date: record.activity_id?.date ? new Date(record.activity_id.date).toLocaleDateString("vi-VN") : "Không có dữ liệu",
            note: record.status === "present" ? "Có mặt" : "Vắng mặt",
        }));

        // 📄 Tạo tài liệu PDF
        const pdfDoc = await PDFDocument.create();
        pdfDoc.registerFontkit(fontkit); // 📌 Đăng ký fontkit

        const page = pdfDoc.addPage([600, 800]);
        const { width, height } = page.getSize();

        // 📥 Nhúng font hỗ trợ Unicode (Times New Roman)
        const fontBytes = fs.readFileSync("fonts/times.ttf");
        const customFont = await pdfDoc.embedFont(fontBytes);

        let y = height - 50;

        // 📝 Tiêu đề
        page.drawText("ĐƠN XÁC NHẬN THÀNH VIÊN CLB", { x: 100, y, size: 18, font: customFont, color: rgb(0, 0, 0) });
        y -= 40;

        // 🏫 Thông tin sinh viên
        const studentInfo = [
            `Họ và Tên: ${student.name}`,
            `Lớp: ${student.classCode}`,
            `MSSV: ${student.studentId}`,
            `Ngành học: ${student.major}`,
        ];
        studentInfo.forEach(text => {
            page.drawText(text, { x: 50, y, size: 12, font: customFont });
            y -= 20;
        });

        // 📌 Danh sách hoạt động
        y -= 30;
        page.drawText("Danh sách hoạt động đã tham gia:", { x: 50, y, size: 14, font: customFont, color: rgb(0, 0, 1) });
        y -= 20;

        activities.forEach(act => {
            page.drawText(`${act.index}. ${act.name} - ${act.date} (${act.note})`, { x: 70, y, size: 12, font: customFont });
            y -= 20;
        });

        // 📂 Lưu file PDF
        const pdfBytes = await pdfDoc.save();
        const outputPath = path.join("exports", `XacNhan_${student.studentId}.pdf`);
        fs.writeFileSync(outputPath, pdfBytes);

        // 📤 Gửi file về client
        res.download(outputPath, `XacNhan_${student.studentId}.pdf`, err => {
            if (err) {
                console.error("❌ Lỗi tải file:", err.message);
                return res.status(500).json({ message: "Lỗi tải file", error: err.message });
            }
            console.log(`📤 File PDF đã gửi: ${outputPath}`);

            // 🗑️ Xóa file sau 60 giây
            setTimeout(() => {
                fs.unlinkSync(outputPath);
                console.log(`🗑️ File đã bị xóa: ${outputPath}`);
            }, 6000);
        });

    } catch (error) {
        console.error("❌ Lỗi xuất file PDF:", error);
        res.status(500).json({ message: "Lỗi xuất file PDF", error: error.message });
    }
};