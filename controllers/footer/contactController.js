const ContactUs = require("../../models/footer/Contact");

// Lấy tất cả Contact Us
exports.getAllContactUs = async (req, res) => {
    try {
        const contactUs = await ContactUs.find({ isDeleted: false });
        res.status(200).json({ status: "success", data: contactUs });
    } catch (error) {
        res.status(500).json({ status: "error", error: "Lỗi lấy dữ liệu Contact Us" });
    }
};

// Tạo mới Contact Us
exports.createContactUs = async (req, res) => {
    try {
        console.log("📩 Received data:", req.body);
        if (!req.body.name || !req.body.mail || !req.body.subject || !req.body.message) {
            return res.status(400).json({ status: "error", error: "Thiếu thông tin cần thiết" });
        }

        const newContactUs = await ContactUs.create(req.body);
        res.status(201).json({ status: "success", data: newContactUs });
    } catch (error) {
        console.error("❌ Error creating contact:", error);
        res.status(500).json({ status: "error", error: "Lỗi tạo Contact Us", details: error.message });
    }
};

// Cập nhật Contact Us
exports.updateContactUs = async (req, res) => {
    const { id } = req.params;
    try {
        const updatedContactUs = await ContactUs.findByIdAndUpdate(id, req.body, { new: true });
        res.status(200).json({ status: "success", data: updatedContactUs });
    } catch (error) {
        res.status(500).json({ status: "error", error: "Lỗi cập nhật Contact Us" });
    }
};


// Xóa cứng Contact Us
exports.hardDeleteContactUs = async (req, res) => {
    const { id } = req.params;
    try {
        await ContactUs.findByIdAndDelete(id);
        res.status(200).json({ status: "success", message: "Contact Us đã bị xóa vĩnh viễn" });
    } catch (error) {
        res.status(500).json({ status: "error", error: "Lỗi xóa cứng Contact Us" });
    }
};
