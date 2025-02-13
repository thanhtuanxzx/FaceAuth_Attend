import * as faceapi from "face-api.js";
import { Canvas, Image, ImageData, loadImage } from "canvas";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

// Load model nhận diện khuôn mặt
const loadModels = async () => {
  const modelPath = path.join(__dirname, "models");
  await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath),
    faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath),
    faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath)
  ]);
};

await loadModels();

// Hàm train khuôn mặt
const trainFaces = async () => {
  const datasetPath = path.join(__dirname, "dataset");

  if (!fs.existsSync(datasetPath)) {
    console.error("❌ Lỗi: Không tìm thấy thư mục dataset!");
    return;
  }

  const labels = fs.readdirSync(datasetPath);
  const labeledFaceDescriptors = [];

  for (const label of labels) {
    const imagesPath = path.join(datasetPath, label);
    if (!fs.existsSync(imagesPath)) continue;

    const images = fs.readdirSync(imagesPath);
    const descriptors = [];

    // Xử lý tất cả hình ảnh cùng lúc
    const detections = await Promise.all(images.map(async (image) => {
      try {
        const imgPath = path.join(imagesPath, image);
        const img = await loadImage(imgPath);

        const detection = await faceapi
          .detectSingleFace(img)
          .withFaceLandmarks()
          .withFaceDescriptor();

        return detection ? detection.descriptor : null;
      } catch (err) {
        console.error(`⚠️ Lỗi xử lý ảnh ${image}:`, err);
        return null;
      }
    }));

    // Lọc bỏ các giá trị null
    descriptors.push(...detections.filter(Boolean));

    if (descriptors.length > 0) {
      labeledFaceDescriptors.push({
        label,
        descriptors: descriptors.map(d => Array.from(d)) // Chuyển về dạng array float
      });
    }
  }

  // Lưu dữ liệu huấn luyện vào JSON
  fs.writeFileSync(
    path.join(__dirname, "trainedData.json"),
    JSON.stringify(labeledFaceDescriptors, null, 2) // Format dễ đọc
  );

  console.log("✅ Training hoàn tất! Dữ liệu đã được lưu.");
};

trainFaces();
