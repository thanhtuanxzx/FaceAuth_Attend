import * as faceapi from "face-api.js";
import { Canvas, Image, ImageData, loadImage } from "canvas";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Cấu hình Canvas cho Node.js
const __dirname = path.dirname(fileURLToPath(import.meta.url));
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

// Load model
const loadModels = async () => {
  const modelPath = path.join(__dirname, "../models");
  await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath);
  await faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath);
  await faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath);
};

await loadModels();

const trainedDataPath = path.join(__dirname, "../trainedData.json");

// 🟢 **Hàm train dữ liệu**
// export const trainFaces = async (req, res) => {
//   try {
//     const datasetPath = path.join(__dirname, "../dataset");
//     const labels = fs.readdirSync(datasetPath);

//     const labeledFaceDescriptors = [];

//     for (const label of labels) {
//       const imagesPath = path.join(datasetPath, label);
//       const images = fs.readdirSync(imagesPath);

//       const descriptors = [];

//       for (const image of images) {
//         const imgPath = path.join(imagesPath, image);
//         const img = await loadImage(imgPath);

//         const detection = await faceapi
//           .detectSingleFace(img)
//           .withFaceLandmarks()
//           .withFaceDescriptor();

//         if (detection) descriptors.push(Array.from(detection.descriptor)); // 🟢 Chuyển thành mảng số
//       }

//       if (descriptors.length > 0) {
//         labeledFaceDescriptors.push({ label, descriptors });
//       }
//     }

//     fs.writeFileSync(trainedDataPath, JSON.stringify(labeledFaceDescriptors, null, 2));
//     res.json({ message: "✅ Training hoàn tất!", data: labeledFaceDescriptors });

//   } catch (error) {
//     console.error("❌ Lỗi training:", error);
//     res.status(500).json({ message: "❌ Lỗi server", error });
//   }
// };

export const trainFaces = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0 || !req.body.label) {
      return res.status(400).json({ message: "❌ Cần có ảnh và nhãn (label)!" });
    }

    const { label } = req.body; // 🏷️ Lấy nhãn của khuôn mặt
    let trainedFaces = [];

    // 📂 **Đọc dữ liệu đã train trước đó**
    if (fs.existsSync(trainedDataPath)) {
      trainedFaces = JSON.parse(fs.readFileSync(trainedDataPath));
    }

    // 🔍 **Tìm xem nhãn đã tồn tại chưa**
    let existingPerson = trainedFaces.find((person) => person.label === label);

    if (!existingPerson) {
      existingPerson = { label, descriptors: [] };
      trainedFaces.push(existingPerson);
    }

    // 📸 **Duyệt qua từng ảnh và trích xuất đặc trưng**
    for (const file of req.files) {
      console.log(`🖼️ Đang xử lý ảnh: ${file.originalname}`);

      const img = await loadImage(file.path);
      const detection = await faceapi
        .detectSingleFace(img)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection) {
        const descriptor = Array.from(detection.descriptor);
        existingPerson.descriptors.push(descriptor); // 🔄 Thêm descriptor vào danh sách
      }

      fs.unlinkSync(file.path); // 🗑️ Xóa ảnh sau khi train
    }

    // 💾 **Lưu dữ liệu đã train**
    fs.writeFileSync(trainedDataPath, JSON.stringify(trainedFaces, null, 2));

    res.json({ message: "✅ Training hoàn tất!", label });

  } catch (error) {
    console.error("❌ Lỗi training:", error);
    res.status(500).json({ message: "❌ Lỗi server", error });
  }
};


// 🟢 **Hàm nhận diện khuôn mặt**
export const verifyFace = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "❌ Không có ảnh tải lên!" });

    console.log(`📸 Ảnh tải lên: ${req.file.path}`);
    const imgPath = path.join(__dirname, "../", req.file.path);
    const img = await loadImage(imgPath);

    const detection = await faceapi
      .detectSingleFace(img)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) return res.status(400).json({ message: "❌ Không tìm thấy khuôn mặt nào!" });

    const uploadedDescriptor = Array.from(detection.descriptor); // 🟢 Chuyển thành mảng số

    // 🟢 **Đọc & chuẩn hóa dữ liệu đã train**
    if (!fs.existsSync(trainedDataPath)) {
      return res.status(500).json({ message: "❌ Chưa có dữ liệu train!" });
    }

    let trainedFaces = JSON.parse(fs.readFileSync(trainedDataPath));

    trainedFaces = trainedFaces.map(person => ({
      label: person.label,
      descriptors: person.descriptors.map(desc => Array.isArray(desc) ? desc : Object.values(desc)) // 🟢 Chuẩn hóa dữ liệu cũ
    }));

    let bestMatch = { label: "Không xác định", distance: Infinity };

    trainedFaces.forEach((person) => {
      if (!person.descriptors || !Array.isArray(person.descriptors) || person.descriptors.length === 0) {
        console.log(`⚠️ Không có descriptors cho: ${person.label}`);
        return;
      }

      person.descriptors.forEach((desc) => {
        const distance = faceapi.euclideanDistance(uploadedDescriptor, desc);
        if (distance < bestMatch.distance) {
          bestMatch = { label: person.label, distance };
        }
      });
    });

    // 🟢 **Ngưỡng nhận diện**
    if (bestMatch.distance < 0.5) {
      res.json({ message: `✅ Nhận diện thành công!`, name: bestMatch.label, distance: bestMatch.distance });
    } else {
      res.json({ message: "❌ Không nhận diện được khuôn mặt!", name: "Không xác định", distance: bestMatch.distance });
    }

    fs.unlinkSync(imgPath); // 🟢 Xóa ảnh sau khi xử lý

  } catch (error) {
    console.error("❌ Lỗi server:", error);
    res.status(500).json({ message: "❌ Lỗi server", error });
  }
};
