import 'dotenv/config';
import express from 'express';
import connectDB from './db/connect.js';
import authRoutes from './routes/auth.js';
import faceRoutes from './routes/faceRoutes.js';
import superAdminRoutes from "./routes/superAdminRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";

const app = express();

app.use(express.json());

// Kết nối MongoDB
connectDB();

// Định tuyến API
app.use('/api/auth', authRoutes);
app.use('/api/face', faceRoutes);
app.use("/api/superadmin", superAdminRoutes);
app.use("/api/students", studentRoutes);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`🚀 Server chạy tại http://localhost:${PORT}`);
});
