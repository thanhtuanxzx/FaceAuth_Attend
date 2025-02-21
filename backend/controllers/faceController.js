import * as faceapi from "face-api.js";
import { Canvas, Image, ImageData, loadImage } from "canvas";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";
import User from '../models/User.js';
import Face from "../models/Face.js";  // ✅ Đảm bảo có dòng này

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
const THRESHOLD = 0.6; // 🔥 Ngưỡng chấp nhận (dưới 0.6 mới tính là cùng một người)

export const trainFaces = async (req, res) => {
  try {
    const user_id = req.user.id;
    if (!user_id) {
      return res.status(401).json({status:401, message: "❌ Không tìm thấy ID người dùng!" });
    }

    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({status:404, message: "❌ Người dùng không tồn tại!" });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ status:400,message: "❌ Cần có ảnh để train!" });
    }

    let trainedFaces = [];
    try {
      trainedFaces = JSON.parse(fs.readFileSync(trainedDataPath));
    } catch (error) {
      console.log("⚠️ Chưa có dữ liệu train, tạo mới...");
    }

    let existingUser = trainedFaces.find((person) => person.user_id === user_id);
    if (!existingUser) {
      existingUser = { user_id, name: user.name, descriptors: [] };
      trainedFaces.push(existingUser);
    }

    let addedCount = 0; // Số ảnh hợp lệ được thêm vào
    let tempDescriptors = []; // Lưu tạm descriptors để kiểm tra số lượng

    await Promise.all(
      req.files.map(async (file) => {
        console.log(`🖼️ Đang xử lý ảnh: ${file.originalname}`);

        const img = await loadImage(file.path);
        const detection = await faceapi
          .detectSingleFace(img)
          .withFaceLandmarks()
          .withFaceDescriptor();

        fs.unlinkSync(file.path); // 🗑️ Xóa ảnh sau khi train

        if (!detection) {
          console.log("⚠️ Không tìm thấy khuôn mặt trong ảnh!");
          return;
        }

        const newDescriptor = Array.from(detection.descriptor);

        // 📌 So sánh với các khuôn mặt đã có của user
        if (existingUser.descriptors.length > 0) {
          const distances = existingUser.descriptors.map((desc) =>
            faceapi.euclideanDistance(newDescriptor, desc)
          );

          const minDistance = Math.min(...distances);

          console.log(`🔎 Khoảng cách nhỏ nhất: ${minDistance}`);
          if (minDistance > THRESHOLD) {
            console.log("❌ Ảnh này có khuôn mặt khác biệt quá nhiều, bỏ qua.");
            return;
          }
        }

        // ✅ Nếu khuôn mặt khớp, thêm vào danh sách tạm
        tempDescriptors.push(newDescriptor);
        addedCount++;
      })
    );

    // ❌ Nếu số ảnh hợp lệ < 10, hủy training
    if (addedCount < 10) {
      return res.status(400).json({status:400,
        message: `❌ Training thất bại! Cần ít nhất 10 ảnh hợp lệ, nhưng chỉ có ${addedCount}.`,
      });
    }

    // 💾 Lưu dữ liệu nếu đủ 10 ảnh
    existingUser.descriptors.push(...tempDescriptors);
    fs.writeFileSync(trainedDataPath, JSON.stringify(trainedFaces, null, 2));

    res.json({status:200,
      message: `✅ Training hoàn tất! Đã thêm ${addedCount} ảnh hợp lệ.`,
      user_id,
      name: user.name,
    });

  } catch (error) {
    console.error("❌ Lỗi training:", error);
    res.status(500).json({status:500, message: "❌ Lỗi server", error: error.message });
  }
};


// export const trainFaces = async (req, res) => {
//   try {
//     // 🔒 Lấy ID user từ token
//     const user_id = req.user.id;
//     if (!user_id) {
//       return res.status(401).json({ message: "❌ Không tìm thấy ID người dùng!" });
//     }

//     // 🔍 Kiểm tra user có tồn tại không
//     const user = await User.findById(user_id);
//     if (!user) {
//       return res.status(404).json({ message: "❌ Người dùng không tồn tại!" });
//     }

//     if (!req.files || req.files.length === 0) {
//       return res.status(400).json({ message: "❌ Cần có ảnh để train!" });
//     }

//     let trainedFaces = [];

//     // 📂 **Đọc dữ liệu đã train trước đó**
//     if (fs.existsSync(trainedDataPath)) {
//       trainedFaces = JSON.parse(fs.readFileSync(trainedDataPath));
//     }

//     // 🔍 **Tìm user đã có dữ liệu train chưa**
//     let existingUser = trainedFaces.find((person) => person.user_id === user_id);

//     if (!existingUser) {
//       existingUser = { user_id, name: user.name, descriptors: [] };
//       trainedFaces.push(existingUser);
//     }

//     // 📸 **Duyệt qua từng ảnh và trích xuất đặc trưng**
//     for (const file of req.files) {
//       console.log(`🖼️ Đang xử lý ảnh: ${file.originalname}`);

//       const img = await loadImage(file.path);
//       const detection = await faceapi
//         .detectSingleFace(img)
//         .withFaceLandmarks()
//         .withFaceDescriptor();

//       if (detection) {
//         const descriptor = Array.from(detection.descriptor);
//         existingUser.descriptors.push(descriptor); // 🔄 Thêm descriptor vào danh sách
//       }

//       fs.unlinkSync(file.path); // 🗑️ Xóa ảnh sau khi train
//     }

//     // 💾 **Lưu dữ liệu đã train**
//     fs.writeFileSync(trainedDataPath, JSON.stringify(trainedFaces, null, 2));

//     res.json({ message: "✅ Training hoàn tất!", user_id, name: user.name });

//   } catch (error) {
//     console.error("❌ Lỗi training:", error);
//     res.status(500).json({ message: "❌ Lỗi server", error });
//   }
// };

// 🟢 **Hàm nhận diện khuôn mặt**
// export const verifyFace = async (req, res) => {
//   try {
//     if (!req.file) return res.status(400).json({ message: "❌ Không có ảnh tải lên!" });

//     console.log(`📸 Ảnh tải lên: ${req.file.path}`);
//     const imgPath = path.join(__dirname, "../", req.file.path);
//     const img = await loadImage(imgPath);

//     const detection = await faceapi
//       .detectSingleFace(img)
//       .withFaceLandmarks()
//       .withFaceDescriptor();

//     if (!detection) return res.status(400).json({ message: "❌ Không tìm thấy khuôn mặt nào!" });

//     const uploadedDescriptor = Array.from(detection.descriptor); // 🟢 Chuyển thành mảng số

//     // 🟢 **Đọc & chuẩn hóa dữ liệu đã train**
//     if (!fs.existsSync(trainedDataPath)) {
//       return res.status(500).json({ message: "❌ Chưa có dữ liệu train!" });
//     }

//     let trainedFaces = JSON.parse(fs.readFileSync(trainedDataPath));

//     trainedFaces = trainedFaces.map(person => ({
//       label: person.label,
//       descriptors: person.descriptors.map(desc => Array.isArray(desc) ? desc : Object.values(desc)) // 🟢 Chuẩn hóa dữ liệu cũ
//     }));

//     let bestMatch = { label: "Không xác định", distance: Infinity };

//     trainedFaces.forEach((person) => {
//       if (!person.descriptors || !Array.isArray(person.descriptors) || person.descriptors.length === 0) {
//         console.log(`⚠️ Không có descriptors cho: ${person.label}`);
//         return;
//       }

//       person.descriptors.forEach((desc) => {
//         const distance = faceapi.euclideanDistance(uploadedDescriptor, desc);
//         if (distance < bestMatch.distance) {
//           bestMatch = { label: person.label, distance };
//         }
//       });
//     });

//     // 🟢 **Ngưỡng nhận diện**
//     if (bestMatch.distance < 0.5) {
//       res.json({ message: `✅ Nhận diện thành công!`, name: bestMatch.label, distance: bestMatch.distance });
//     } else {
//       res.json({ message: "❌ Không nhận diện được khuôn mặt!", name: "Không xác định", distance: bestMatch.distance });
//     }

//     fs.unlinkSync(imgPath); // 🟢 Xóa ảnh sau khi xử lý

//   } catch (error) {
//     console.error("❌ Lỗi server:", error);
//     res.status(500).json({ message: "❌ Lỗi server", error });
//   }
// };

// export const verifyFace = async (req, res) => {
//   try {
//     if (!req.file) return res.status(400).json({ message: "❌ Không có ảnh tải lên!" });

//     console.log(`📸 Ảnh tải lên: ${req.file.path}`);
//     const imgPath = path.join(__dirname, "../", req.file.path);
//     const img = await loadImage(imgPath);

//     const detection = await faceapi
//       .detectSingleFace(img)
//       .withFaceLandmarks()
//       .withFaceDescriptor();

//     if (!detection) return res.status(400).json({ message: "❌ Không tìm thấy khuôn mặt nào!" });

//     const uploadedDescriptor = Array.from(detection.descriptor);

//     if (!fs.existsSync(trainedDataPath)) {
//       return res.status(500).json({ message: "❌ Chưa có dữ liệu train!" });
//     }

//     let trainedFaces = JSON.parse(fs.readFileSync(trainedDataPath));

//     trainedFaces = trainedFaces.map(person => ({
//       label: person.label,
//       descriptors: person.descriptors.map(desc => Array.isArray(desc) ? desc : Object.values(desc))
//     }));

//     let bestMatch = { label: "Không xác định", distance: Infinity };

//     trainedFaces.forEach((person) => {
//       if (!person.descriptors || !Array.isArray(person.descriptors) || person.descriptors.length === 0) {
//         console.log(`⚠️ Không có descriptors cho: ${person.label}`);
//         return;
//       }

//       person.descriptors.forEach((desc) => {
//         const distance = faceapi.euclideanDistance(uploadedDescriptor, desc);
//         if (distance < bestMatch.distance) {
//           bestMatch = { label: person.label, distance };
//         }
//       });
//     });

//     fs.unlinkSync(imgPath); // Xóa ảnh sau khi xử lý

//     if (bestMatch.distance < 0.5) {
//       // ✅ Nếu nhận diện thành công, tạo token tạm thời
//       const authToken = jwt.sign({ name: bestMatch.label }, process.env.JWT_SECRET, { expiresIn: "2m" });

//       return res.json({
//         message: `✅ Nhận diện thành công!`,
//         name: bestMatch.label,
//         distance: bestMatch.distance,
//         token: authToken, // 🔥 Gửi token về frontend
//       });
//     } else {
//       return res.json({ message: "❌ Không nhận diện được khuôn mặt!", name: "Không xác định", distance: bestMatch.distance });
//     }

//   } catch (error) {
//     console.error("❌ Lỗi server:", error);
//     res.status(500).json({ message: "❌ Lỗi server", error });
//   }
// };

// export const verifyFace = async (req, res) => {
//   try {
//       if (!req.file) return res.status(400).json({ message: "❌ Không có ảnh tải lên!" });

//       console.log(`📸 Ảnh tải lên: ${req.file.path}`);
//       const imgPath = path.join(__dirname, "../", req.file.path);
//       const img = await loadImage(imgPath);

//       const detection = await faceapi
//           .detectSingleFace(img)
//           .withFaceLandmarks()
//           .withFaceDescriptor();

//       if (!detection) return res.status(400).json({ message: "❌ Không tìm thấy khuôn mặt nào!" });

//       const uploadedDescriptor = Array.from(detection.descriptor);

//       if (!fs.existsSync(trainedDataPath)) {
//           return res.status(500).json({ message: "❌ Chưa có dữ liệu train!" });
//       }

//       let trainedFaces = JSON.parse(fs.readFileSync(trainedDataPath));

//       let bestMatch = { label: "Không xác định", distance: Infinity };

//       trainedFaces.forEach((person) => {
//           person.descriptors.forEach((desc) => {
//               const distance = faceapi.euclideanDistance(uploadedDescriptor, desc);
//               if (distance < bestMatch.distance) {
//                   bestMatch = { label: person.label, distance };
//               }
//           });
//       });

//       fs.unlinkSync(imgPath);

//       if (bestMatch.distance < 0.5) {
//           const oldToken = req.headers.authorization?.split(" ")[1];
//           if (!oldToken) return res.status(401).json({ message: "Thiếu token đăng nhập!" });

//           const decoded = jwt.verify(oldToken, process.env.JWT_SECRET);

//           // 🔥 Chuyển `name` thành `id`
//           const student = await User.findOne({ name: bestMatch.label });
//           if (!student) return res.status(404).json({ message: "Không tìm thấy sinh viên!" });

//           const newToken = jwt.sign(
//               { id: student._id, is_face_verified: true },
//               process.env.JWT_SECRET,
//               { expiresIn: "1h" }
//           );

//           return res.json({ message: `✅ Nhận diện thành công!`, token: newToken });
//       } else {
//           return res.status(400).json({ message: "❌ Không nhận diện được khuôn mặt!" });
//       }
//   } catch (error) {
//       console.error("❌ Lỗi server:", error);
//       res.status(500).json({ message: "❌ Lỗi server", error });
//   }
// };

export const verifyFace = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({status:400, message: "❌ Cần tải lên ảnh!" });
    }

    console.log(`📸 Ảnh tải lên: ${req.file.path}`);

    // 📌 **Lấy token từ request header**
    const token = req.headers.authorization?.split(" ")[1]; // "Bearer <token>"
    if (!token) {
      return res.status(401).json({status:401, message: "❌ Chưa đăng nhập!" });
    }

    // ✅ **Giải mã token**
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({status:401, message: "❌ Token không hợp lệ!" });
    }

    console.log(`🔑 Token giải mã:`, decoded);

    const { activity_id } = req.body;
    if (!activity_id) {
      return res.status(400).json({status:400, message: "❌ Thiếu activity_id!" });
    }

    // 🔍 **Đọc dữ liệu khuôn mặt đã train**
    if (!fs.existsSync(trainedDataPath)) {
      return res.status(400).json({ status:400,message: "❌ Chưa có dữ liệu khuôn mặt đã train!" });
    }
    const trainedFaces = JSON.parse(fs.readFileSync(trainedDataPath, "utf8"));

    // 📷 **Trích xuất đặc trưng khuôn mặt từ ảnh tải lên**
    const img = await loadImage(req.file.path);
    const detection = await faceapi
      .detectSingleFace(img)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      return res.status(400).json({ status:400,message: "❌ Không tìm thấy khuôn mặt trong ảnh!" });
    }

    const uploadedDescriptor = detection.descriptor;
    let bestMatch = null;
    let minDistance = Infinity;

    // 🔍 **So sánh với dữ liệu đã train**
    for (const person of trainedFaces) {
      for (const descriptor of person.descriptors) {
        const distance = faceapi.euclideanDistance(uploadedDescriptor, descriptor);
        if (distance < minDistance) {
          minDistance = distance;
          bestMatch = person;
        }
      }
    }

    console.log(`🎯 Kết quả nhận diện: ${bestMatch?.user_id || "Không tìm thấy"}`);
    console.log(`📏 Khoảng cách: ${minDistance}`);

    const THRESHOLD = 0.5; // Ngưỡng xác thực khuôn mặt

    if (bestMatch && minDistance < THRESHOLD) {
      const recognizedUserId = bestMatch.user_id;

      // 🔄 **So sánh với `user_id` từ token**
      if (recognizedUserId === decoded.id) {
        // 🔑 **Tạo token mới có thêm `activity_id`**
        const newToken = jwt.sign(
          { id: decoded.id, email: decoded.email, role: decoded.role, activity_id },
          process.env.JWT_SECRET,
          { expiresIn: "30m" }
        );

        return res.json({status:200,
          message: "✅ Xác thực khuôn mặt thành công!",
          user_id: recognizedUserId,
          distance: minDistance,
          token: newToken,
        });
      } else {
        return res.status(403).json({status:403, message: "❌ User không khớp với token đăng nhập!" });
      }
    } else {
      return res.status(400).json({status:400, message: "❌ Không tìm thấy khuôn mặt khớp!" });
    }
  } catch (error) {
    console.error("❌ Lỗi nhận diện khuôn mặt:", error);
    res.status(500).json({status:500, message: "❌ Lỗi server", error: error.message });
  } finally {
    if (req.file) fs.unlinkSync(req.file.path); // 🗑️ Xóa ảnh sau khi xử lý
  }
};
// Lưu dữ liệu khuôn mặt
// Lưu dữ liệu khuôn mặt theo userId từ token
export const saveFaceData = async (req, res) => {
  try {
      const userId = req.user.id;
      console.log("Received request:", req.body); // 👉 Debug dữ liệu nhận được

      const { faceData } = req.body;

      if (!faceData) {
          return res.status(400).json({ message: "Missing faceData" });
      }

      let face = await Face.findOne({ userId });

      if (face) {
          face.faceData = faceData;
          await face.save();
          return res.status(200).json({ message: "Face data updated successfully!" });
      }

      face = new Face({ userId, faceData });
      await face.save();

      return res.status(201).json({ message: "Face data saved successfully!" });
  } catch (error) {
      return res.status(500).json({ message: "Error saving face data", error: error.message });
  }
};


// Lấy dữ liệu khuôn mặt dựa vào userId từ token
export const getFaceData = async (req, res) => {
  try {
      const userId = req.user.id; // Lấy userId từ token
      const face = await Face.findOne({ userId });

      if (!face) {
          return res.status(404).json({ message: "Face data not found" });
      }

      return res.status(200).json(face);
  } catch (error) {
      return res.status(500).json({ message: "Error retrieving face data", error: error.message });
  }
};