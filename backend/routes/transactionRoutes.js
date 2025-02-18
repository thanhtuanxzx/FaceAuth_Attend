import express from 'express';
import { createPayment, momoWebhook, getTransactions } from '../controllers/transactionController.js';

const router = express.Router();

router.post('/create-payment', createPayment);
router.post('/momo-webhook', momoWebhook);
router.get('/transactions', getTransactions);

export default router;
