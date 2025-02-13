import jwt from "jsonwebtoken";

// Middleware kiểm tra xác thực
export const authenticateUser = (req, res, next) => {
    const token = req.header("Authorization");

    console.log("Received Token:", token); // 🛠 In token để kiểm tra
    // console.log("JWT Secret Key:", process.env.JWT_SECRET); // 🛠 In Secret Key

    if (!token) {
        console.log("🚨 Không có token được gửi!");
        return res.status(401).json({ message: "Không có token, từ chối truy cập!" });
    }

    try {
        const extractedToken = token.replace("Bearer ", ""); // Lấy token đúng định dạng
        // console.log("Extracted Token:", extractedToken); // 🛠 In token đã xử lý

        const decoded = jwt.verify(extractedToken, process.env.JWT_SECRET);
        // console.log("Decoded Token:", decoded); // 🛠 Xem nội dung token

        req.user = decoded;
        console.log("Request User:", req.user); // 🛠 Kiểm tra user từ token

        next();
    } catch (error) {
        // console.error("🚨 Lỗi xác thực Token:", error.message);
        res.status(401).json({ message: "Token không hợp lệ!" });
    }
};

// Middleware kiểm tra role
export const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: "Bạn không có quyền truy cập!" });
        }
        next();
    };
};
