import fs from "fs";
import { PDFDocument } from "pdf-lib";

const checkPDFFields = async () => {
    try {
        const pdfBytes = fs.readFileSync("template.pdf");  // Đọc file template
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const form = pdfDoc.getForm();
        const fields = form.getFields();

        console.log("📌 Danh sách các fields trong template PDF:");
        fields.forEach(field => console.log(`- ${field.getName()}`));

    } catch (error) {
        console.error("❌ Lỗi khi kiểm tra fields trong PDF:", error);
    }
};

checkPDFFields();
