import fs from "fs";
import path from "path";
import mammoth from "mammoth";

export const generateClubConfirmation = (name, birthDate, className, course, studentId, major, faculty, position, activities) => {
    const templatePath = path.join("templates", "DON_XAC_NHAN_TEMPLATE.docx");
    const outputPath = path.join("exports", `XacNhan_${studentId}.docx`);

    // Đọc file Word mẫu
    fs.readFile(templatePath, (err, data) => {
        if (err) throw err;

        mammoth.convertToHtml({ buffer: data }).then(result => {
            let html = result.value;

            // Thay thế dữ liệu
            html = html.replace(/{{name}}/g, name)
                .replace(/{{birthDate}}/g, birthDate)
                .replace(/{{className}}/g, className)
                .replace(/{{course}}/g, course)
                .replace(/{{studentId}}/g, studentId)
                .replace(/{{major}}/g, major)
                .replace(/{{faculty}}/g, faculty)
                .replace(/{{position}}/g, position);

            // Xử lý danh sách hoạt động
            let activitiesHTML = activities.map((activity, index) => 
                `<p>${index + 1}. ${activity.name} - ${activity.date} (${activity.note})</p>`).join("");

            html = html.replace(/{{#activities}}[\s\S]*{{\/activities}}/, activitiesHTML);

            // Ghi lại file Word mới
            fs.writeFileSync(outputPath, Buffer.from(html));

            console.log("📄 File Word đã tạo:", outputPath);
        });
    });

    return outputPath;
};
