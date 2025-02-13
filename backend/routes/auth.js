import express from 'express';
import { register, login, forgotPassword ,verifyEmail, resetPassword} from '../controllers/authController.js';
// import { register, , login } from "../controllers/authController.js";

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.get("/verify/:token", verifyEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);


export default router;
