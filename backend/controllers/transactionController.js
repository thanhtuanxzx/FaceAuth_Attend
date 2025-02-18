import crypto from 'crypto';
import https from 'https';
import Transaction from '../models/Transaction.js';
import dotenv from 'dotenv';

dotenv.config();

const MOMO_PARTNER_CODE = process.env.MOMO_PARTNER_CODE || 'MOMO';
const MOMO_ACCESS_KEY = process.env.MOMO_ACCESS_KEY || 'F8BBA842ECF85';
const MOMO_SECRET_KEY = process.env.MOMO_SECRET_KEY || 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
const MOMO_API_URL = 'https://test-payment.momo.vn/v2/gateway/api/create';

export const createPayment = async (req, res) => {
    try {
        const { userId, amount, orderInfo } = req.body;
        const orderId = MOMO_PARTNER_CODE + new Date().getTime();
        const requestId = orderId;
        const redirectUrl = 'https://your-redirect-url.com';///trang trar veef
        const ipnUrl = 'https://your-webhook-url.com';
        const requestType = "captureWallet";
        const extraData = '';

        // Tạo chữ ký (signature)
        const rawSignature = `accessKey=${MOMO_ACCESS_KEY}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${MOMO_PARTNER_CODE}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
        const signature = crypto.createHmac('sha256', MOMO_SECRET_KEY).update(rawSignature).digest('hex');

        // Lưu giao dịch vào DB
        const transaction = new Transaction({ userId, orderId, requestId, amount, status: 'pending' });
        await transaction.save();

        // Gửi request đến MoMo
        const requestBody = JSON.stringify({
            partnerCode: MOMO_PARTNER_CODE,
            partnerName: "Test",
            storeId: "MomoTestStore",
            requestId,
            amount,
            orderId,
            orderInfo,
            redirectUrl,
            ipnUrl,
            lang: 'vi',
            requestType,
            autoCapture: true,
            extraData,
            signature
        });

        const options = {
            hostname: 'test-payment.momo.vn',
            port: 443,
            path: '/v2/gateway/api/create',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(requestBody),
            }
        };

        const momoRequest = https.request(options, (momoRes) => {
            let responseBody = '';
            momoRes.on('data', (chunk) => responseBody += chunk);
            momoRes.on('end', () => {
                const momoResponse = JSON.parse(responseBody);
                if (momoResponse.resultCode === 0) {
                    res.json({ message: 'Tạo giao dịch thành công!', paymentUrl: momoResponse.payUrl });
                } else {
                    res.status(400).json({ message: 'Giao dịch thất bại!', error: momoResponse });
                }
            });
        });

        momoRequest.on('error', (error) => {
            console.error("❌ Lỗi gửi request tới MoMo:", error);
            res.status(500).json({ message: 'Lỗi kết nối tới MoMo!', error: error.message });
        });

        momoRequest.write(requestBody);
        momoRequest.end();

    } catch (error) {
        console.error("❌ Lỗi tạo giao dịch:", error);
        res.status(500).json({ message: "Lỗi tạo giao dịch", error: error.message });
    }
};

// Xử lý webhook MoMo
export const momoWebhook = async (req, res) => {
    try {
        const { orderId, resultCode, message } = req.body;
        const transaction = await Transaction.findOne({ orderId });

        if (!transaction) return res.status(404).json({ message: "Giao dịch không tồn tại!" });

        transaction.status = resultCode === 0 ? 'success' : 'failed';
        transaction.resultCode = resultCode;
        transaction.message = message;
        transaction.updatedAt = new Date();
        await transaction.save();

        res.json({ message: "Cập nhật trạng thái giao dịch thành công!" });
    } catch (error) {
        console.error("❌ Lỗi xử lý webhook MoMo:", error);
        res.status(500).json({ message: "Lỗi xử lý webhook", error: error.message });
    }
};

// Lấy danh sách giao dịch
export const getTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find().populate('userId', 'username email');
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: "Lỗi lấy danh sách giao dịch", error: error.message });
    }
};
