import { fileURLToPath } from "url";
import path from "path";

import User from "../models/User.js";
import Activity from "../models/Activity.js";
import AttendanceRecord from "../models/AttendanceRecord.js";
import puppeteer from "puppeteer";
import XLSX from "xlsx";
import { PDFDocument, rgb } from "pdf-lib";
// import path from "path";
import fs from "fs";
import { createRequire } from "module";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);
const fontkit = require("fontkit");

// import { PDFDocument } from "pdf-lib";
export const exportPDFConfirmation = async (req, res) => {
    try {
        const { student_id } = req.params;

        // 🔍 Lấy thông tin sinh viên
        const student = await User.findById(student_id);
        if (!student) {
            return res.status(404).json({ message: "Không tìm thấy sinh viên" });
        }

        // 🔍 Lấy danh sách hoạt động
        const attendanceRecords = await AttendanceRecord.find({ student_id: student._id })
            .populate("activity_id", "name date description")
            .lean();

        const activitiesHTML = attendanceRecords.map((record, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${record.activity_id?.name || "Không có dữ liệu"}</td>
                <td>${record.activity_id?.date ? new Date(record.activity_id.date).toLocaleDateString("vi-VN") : "Không có dữ liệu"}</td>
                <td>${record.status === "present" ? "Có mặt" : "Vắng mặt"}</td>
                <td>${record.activity_id?.description || "Không có mô tả"}</td>
            </tr>
        `).join("");

        // 📥 Đọc template HTML
        const templatePath = path.join(__dirname, "../templates/template.html");
        let htmlContent = fs.readFileSync(templatePath, "utf-8");

        // 🔄 Thay thế dữ liệu vào template
        htmlContent = htmlContent
            .replace("{{name}}", student.name || "")
            .replace("{{classCode}}", student.classCode || "")
            .replace("{{studentId}}", student.studentId || "")
            .replace("{{major}}", student.major || "")
            .replace("{{activitiesl}}", activitiesHTML);

        // 🖨️ Xuất PDF bằng Puppeteer
        const browser = await puppeteer.launch({ headless: "new" });
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: "networkidle0" });

        const outputDir = path.join(__dirname, "../exports");
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir);
        }

        const outputPath = path.join(outputDir, `XacNhan_${student.studentId}.pdf`);
        await page.pdf({ path: outputPath, format: "A4" });

        await browser.close();

        // 📤 Gửi file về client
        res.download(outputPath, `XacNhan_${student.studentId}.pdf`, err => {
            if (err) {
                console.error("❌ Lỗi tải file:", err.message);
                return res.status(500).json({status:500, message: "Lỗi tải file", error: err.message });
            }
            console.log(`📤 File PDF đã gửi: ${outputPath}`);

            // 🗑️ Xóa file sau 60 giây
            setTimeout(() => {
                if (fs.existsSync(outputPath)) {
                    fs.unlinkSync(outputPath);
                    console.log(`🗑️ File đã bị xóa: ${outputPath}`);
                }
            }, 60000);
        });

    } catch (error) {
        console.error("❌ Lỗi xuất file PDF:", error);
        res.status(500).json({status:500, message: "Lỗi xuất file PDF", error: error.message });
    }
};
// export const exportPDFConfirmation = async (req, res) => {
//     try {
//         const { student_id } = req.params;

//         // 🔍 Tìm thông tin sinh viên theo studentId (không phải _id)
//         const student = await User.findById(student_id);
//         if (!student ) {
//             return res.status(404).json({ message: "Không tìm thấy sinh viên!" });
//         }

//         console.log("🎯 Dữ liệu sinh viên:", student);

//         // 🔍 Lấy danh sách hoạt động của sinh viên từ AttendanceRecord
//         const attendanceRecords = await AttendanceRecord.find({ student_id: student._id })
//             .populate("activity_id", "name date description")
//             .lean();

//         const activities = attendanceRecords.map((record, index) => ({
//             index: index + 1,
//             name: record.activity_id?.name || "Không có dữ liệu",
//             date: record.activity_id?.date ? new Date(record.activity_id.date).toLocaleDateString("vi-VN") : "Không có dữ liệu",
//             status: record.status === "present" ? "Có mặt" : "Vắng mặt",
//             description: record.activity_id?.description || "Không có mô tả",
//         }));

//         // 📥 Load template PDF
//         const templatePath = path.resolve("templates/template.pdf");
//         if (!fs.existsSync(templatePath)) {
//             return res.status(500).json({ message: "Không tìm thấy file template PDF" });
//         }

//         const templateBytes = fs.readFileSync(templatePath);
//         const pdfDoc = await PDFDocument.load(templateBytes);
//         pdfDoc.registerFontkit(fontkit);

//         // 📥 Load font Unicode (Times New Roman)
//         const fontPath = path.resolve("fonts/times.ttf");
//         if (!fs.existsSync(fontPath)) {
//             return res.status(500).json({ message: "Không tìm thấy file font" });
//         }
//         const fontBytes = fs.readFileSync(fontPath);
//         const customFont = await pdfDoc.embedFont(fontBytes);

//         // 📌 Lấy form từ template PDF
//         const form = pdfDoc.getForm();

//         // 📝 Điền thông tin sinh viên vào form PDF
//         const fields = {
//             Text1: student.name || "",
//             Text2: student.birthDate || "Không có dữ liệu",
//             Text3: student.classCode || "Không có dữ liệu",
//             Text4: student.course || "Không có dữ liệu",
//             Text5: student.studentId || "",
//             Text6: student.major || "Không có dữ liệu",
//             Text7: student.faculty || "Không có dữ liệu",
//             Text8: student.position || "Không có dữ liệu"
//         };

//         for (const [key, value] of Object.entries(fields)) {
//             const field = form.getTextField(key);
//             if (field) {
//                 field.setText(value);
//                 field.updateAppearances(customFont);
//             }
//         }

//         // 📌 Lấy trang đầu tiên từ template để vẽ danh sách hoạt động
//         const pages = pdfDoc.getPages();
//         const page = pages[0];

//         let y = 350; // Vị trí bắt đầu ghi danh sách hoạt động

//         page.drawText("📌 Danh sách hoạt động đã tham gia:", { x: 50, y, size: 14, font: customFont, color: rgb(0, 0, 1) });
//         y -= 20;

//         activities.forEach(act => {
//             page.drawText(`🔹 ${act.index}. ${act.name}`, { x: 70, y, size: 12, font: customFont, color: rgb(0, 0, 0) });
//             y -= 20;
//             page.drawText(`📅 Ngày diễn ra: ${act.date}`, { x: 90, y, size: 10, font: customFont });
//             y -= 15;
//             page.drawText(`✅ Trạng thái: ${act.status}`, { x: 90, y, size: 10, font: customFont });
//             y -= 15;
//             page.drawText(`📝 Ghi chú: ${act.description}`, { x: 90, y, size: 10, font: customFont });
//             y -= 30; // Khoảng cách giữa các hoạt động
//         });

//         // 🔒 Đặt form ở chế độ chỉ đọc
//         form.flatten();

//         // 📂 Lưu file PDF
//         const outputDir = "exports";
//         if (!fs.existsSync(outputDir)) {
//             fs.mkdirSync(outputDir);
//         }

//         const outputPath = path.join(outputDir, `XacNhan_${student.studentId}.pdf`);
//         const pdfBytes = await pdfDoc.save();
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
//                 if (fs.existsSync(outputPath)) {
//                     fs.unlinkSync(outputPath);
//                     console.log(`🗑️ File đã bị xóa: ${outputPath}`);
//                 }
//             }, 60000);
//         });

//     } catch (error) {
//         console.error("❌ Lỗi xuất file PDF:", error);
//         res.status(500).json({ message: "Lỗi xuất file PDF", error: error.message });
//     }
// };

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

        res.json({status:200,
            message: "Thống kê tổng quan hệ thống",
            totalAdmins,
            totalStudents,
            totalActivities,
            totalCheckIns
        });
    } catch (error) {
        res.status(500).json({status:500, message: "Lỗi thống kê tổng quan", error: error.message });
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

        return res.status(200).json({status:200,
            success: true,
            message: "Thống kê hoạt động thành công",
            data: activityStats
        });

    } catch (error) {
        console.error("Lỗi thống kê hoạt động:", error);
        return res.status(500).json({status:500,
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

        res.json({ status:200,message: "Thống kê sinh viên", studentStats });
    } catch (error) {
        res.status(500).json({status:500, message: "Lỗi thống kê sinh viên", error: error.message });
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
            return res.status(400).json({ status:400,message: "Loại thống kê không hợp lệ" });
        }

        const dateStats = await AttendanceRecord.aggregate([
            { $match: { createdAt: { $gte: startDate, $lt: endDate } } },
            { $group: { _id: null, totalCheckIns: { $sum: 1 } } }
        ]);

        res.json({status:200, message: `Thống kê theo ${type}`, totalCheckIns: dateStats[0]?.totalCheckIns || 0 });
    } catch (error) {
        res.status(500).json({ status:500,message: "Lỗi thống kê theo ngày/tháng/năm", error: error.message });
    }
};



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
            return res.status(404).json({status:404, message: "Không có dữ liệu điểm danh!" });
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
                return res.status(500).json({ status:500,message: "Lỗi tải file", error: err.message });
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
        res.status(500).json({ status:500,message: "Lỗi xuất thống kê Excel", error: error.message });
    }
};



