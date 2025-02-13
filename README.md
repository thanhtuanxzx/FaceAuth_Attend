# 📌 Ứng Dụng Điểm Danh - Backend API

## 🚀 Giới Thiệu
Đây là backend API cho hệ thống điểm danh sử dụng **Node.js**, **Express**, **MongoDB**, và **JWT Authentication**. API hỗ trợ các tính năng:
- 🔐 Đăng ký, đăng nhập, quên mật khẩu
- 📸 Xác thực khuôn mặt với AI
- 📊 Quản lý điểm danh

---

## 🛠️ Công Nghệ Sử Dụng
- **Node.js + Express.js** - Xây dựng backend API
- **MongoDB + Mongoose** - Cơ sở dữ liệu NoSQL
- **JWT (JSON Web Token)** - Xác thực người dùng
- **bcrypt** - Mã hóa mật khẩu
- **Nodemailer** - Gửi email xác thực

---

## 📦 Cài Đặt
### 🔽 Clone dự án
```bash
git clone https://github.com/your-repo/app_diem_danh.git
cd app_diem_danh/backend
```
### 📌 Cài đặt package
```bash
npm install
```

### 🔧 Cấu hình `.env`
Tạo file `.env` trong thư mục `backend/` và thêm:
```env
PORT=8000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
JWT_SECRET=your_jwt_secret_key
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-email-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=your-email@gmail.com
```
---

## 🚀 Chạy Server
```bash
npm start
```
Server sẽ chạy tại: [http://localhost:8000](http://localhost:8000)

---

## 🔥 API Endpoints

### 📝 Xác thực người dùng
| Phương thức | Endpoint         | Mô tả                  |
|------------|-----------------|------------------------|
| `POST`     | `/api/auth/register` | Đăng ký tài khoản      |
| `POST`     | `/api/auth/login`    | Đăng nhập              |
| `POST`     | `/api/auth/forgot-password` | Quên mật khẩu |

### 📸 Quản lý điểm danh
| Phương thức | Endpoint        | Mô tả                   |
|------------|----------------|-------------------------|
| `POST`     | `/api/face/verify` | Xác thực khuôn mặt    |
| `GET`      | `/api/attendance`  | Lấy danh sách điểm danh |
| `POST`     | `/api/attendance/mark` | Điểm danh         |

---

## 🛠️ Góp Ý & Phát Triển
Mọi đóng góp đều được hoan nghênh! Hãy tạo **Issue** hoặc gửi **Pull Request** để cải thiện dự án. 😍

---

## 📜 Giấy Phép
Dự án này được phát hành theo **MIT License**. Cảm ơn bạn đã sử dụng! 🙌

