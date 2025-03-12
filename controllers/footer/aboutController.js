const jwt = require("jsonwebtoken");
const UserModel = require("../../models/UserModel");
const AboutUs = require("../../models/footer/About");

// Lấy tất cả About Us
exports.getAllAboutUs = async (req, res) => {
    try {
        let filter = { isDeleted: false, isVisible: true }; // Mặc định: chỉ lấy dữ liệu chưa bị xóa & có thể hiển thị

        // Lấy token từ request (cookie hoặc header)
        const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

        if (token) {
            try {
                // Giải mã token để lấy user ID
                const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
                const user = await UserModel.findById(decoded.id);

                if (user && (user.role === "admin" || user.role === "nutritionist")) {
                    filter = {}; // Admin/Nutritionist thấy TẤT CẢ dữ liệu, không áp dụng filter
                }
            } catch (error) {
                console.error("Invalid token:", error.message);
            }
        }

        // Lấy dữ liệu About Us theo điều kiện
        const aboutUs = await AboutUs.find(filter);
        res.status(200).json({ status: "success", data: aboutUs });
    } catch (error) {
        res.status(500).json({ status: "fail", message: "Lỗi lấy dữ liệu About Us" });
    }
};


// Tạo mới About Us
exports.createAboutUs = async (req, res) => {
    try {
        console.log("Dữ liệu nhận từ client:", req.body);

        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ status: "fail", error: "Body request rỗng!" });
        }

        const { bannerUrl, content } = req.body;
        console.log("bannerUrl:", bannerUrl, "content:", content);

        if (!bannerUrl || !content) {
            return res.status(400).json({ status: "fail", error: "Thiếu dữ liệu đầu vào!" });
        }

        const newAboutUs = await AboutUs.create({ bannerUrl, content });
        res.status(201).json({ status: "success", data: newAboutUs });
    } catch (error) {
        console.error("Lỗi khi tạo About Us:", error);
        res.status(500).json({ status: "fail", error: "Lỗi server khi tạo About Us" });
    }
};


// Cập nhật About Us
exports.updateAboutUs = async (req, res) => {
    const { id } = req.params;
    try {
        const updatedAboutUs = await AboutUs.findByIdAndUpdate(id, req.body, { new: true });
        res.status(200).json({ status: "success", data: updatedAboutUs });
    } catch (error) {
        res.status(500).json({ status: "fail", error: "Lỗi cập nhật About Us" });
    }
};


// Xóa cứng About Us
exports.hardDeleteAboutUs = async (req, res) => {
    const { id } = req.params;
    try {
        await AboutUs.findByIdAndDelete(id);
        res.status(200).json({ status: "success", message: "About Us đã bị xóa vĩnh viễn" });
    } catch (error) {
        res.status(500).json({ status: "fail", error: "Lỗi xóa cứng About Us" });
    }
};
