import 'dotenv/config';
import express from 'express';
import cors from 'cors'; // ✅ Import CORS
import connectDB from './db/connect.js';
import authRoutes from './routes/auth.js';
import faceRoutes from './routes/faceRoutes.js';
import superAdminRoutes from "./routes/superAdminRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import statisticsRoutes from "./routes/statisticsRoutes.js";
import transactionRoutes from './routes/transactionRoutes.js';
import evaluationRoutes from "./routes/evaluationRoutes.js";
import groupAdminRoutes from './routes/groupAdminRoutes.js';
const app = express();

app.use(express.json());

// 🔥 Cấu hình CORS
app.use(cors({
    origin: "*", // ✅ Cho phép tất cả domain truy cập
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));

// Kết nối MongoDB
connectDB();

// Định tuyến API
app.use('/api/auth', authRoutes);
app.use('/api/face', faceRoutes);
app.use("/api/superadmin", superAdminRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/statistics", statisticsRoutes);
app.use('/api/transactions', transactionRoutes);
app.use("/api/evaluation", evaluationRoutes);
app.use('/group-admin', groupAdminRoutes);

const PORT = process.env.PORT || 8000;
const HOST = "0.0.0.0"; // ✅ Lắng nghe trên tất cả các IP

app.listen(PORT, HOST, () => {
    console.log(`🚀 Server chạy tại http://${HOST}:${PORT}`);            
});
