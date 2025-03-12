const jwt = require("jsonwebtoken");
const UserModel = require("../../models/UserModel");
const FAQ = require("../../models/footer/FAQs");

// 🔹 Lấy tất cả FAQs
exports.getAllFAQs = async (req, res) => {
  try {
    let filter = { isDeleted: false, isVisible: true }; // Mặc định: Chỉ lấy FAQ chưa bị xóa

    // 🛠️ Kiểm tra token để phân quyền
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        const user = await UserModel.findById(decoded.id);

        if (user && (user.role === "admin" || user.role === "nutritionist")) {
          filter = {}; // Admin/Nutritionist thấy tất cả
        }
      } catch (error) {
        console.error("⚠️ Invalid token:", error.message);
      }
    }

    // 🔍 Lấy dữ liệu từ database
    const faqs = await FAQ.find(filter);
    console.log("📌 FAQs:", faqs);

    res.json({ status: "success", data: faqs });
  } catch (error) {
    console.error("❌ Lỗi khi lấy FAQs:", error);
    res.status(500).json({ status: "error", message: "Lỗi server khi tải FAQs", error: error.message });
  }
};

// 🔹 Tạo mới FAQ
exports.createFAQ = async (req, res) => {
  try {
    console.log("📤 Dữ liệu từ client:", req.body);

    const { category, question, answer } = req.body;
    if (!category || !question || !answer) {
      return res.status(400).json({ status: "error", message: "Vui lòng nhập đầy đủ category, question và answer." });
    }

    const newFaq = await FAQ.create({ category, question, answer });
    console.log("✅ FAQ mới được tạo:", newFaq);

    res.status(201).json({ status: "success", message: "Thêm FAQ thành công!", data: newFaq });
  } catch (error) {
    console.error("❌ Lỗi khi tạo FAQ:", error);
    res.status(500).json({ status: "error", message: "Lỗi server khi tạo FAQ", error: error.message });
  }
};

// 🔹 Cập nhật FAQ
exports.updateFAQ = async (req, res) => {
  try {
    console.log(`📤 Cập nhật FAQ ID: ${req.params.id}`, req.body);

    const updatedFaq = await FAQ.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updatedFaq) {
      return res.status(404).json({ status: "error", message: "FAQ không tồn tại." });
    }

    console.log("✅ FAQ đã được cập nhật:", updatedFaq);
    res.json({ status: "success", message: "Cập nhật thành công!", data: updatedFaq });
  } catch (error) {
    console.error("❌ Lỗi khi cập nhật FAQ:", error);
    res.status(500).json({ status: "error", message: "Lỗi server khi cập nhật FAQ", error: error.message });
  }
};

// 🔹 Xóa vĩnh viễn FAQ
exports.hardDeleteFAQ = async (req, res) => {
  try {
    console.log(`🗑️ Xóa vĩnh viễn FAQ ID: ${req.params.id}`);

    await FAQ.findByIdAndDelete(req.params.id);
    res.status(200).json({ status: "success", message: "FAQ đã bị xóa vĩnh viễn" });
  } catch (error) {
    console.error("❌ Lỗi khi xóa FAQ:", error);
    res.status(500).json({ status: "error", message: "Lỗi server khi xóa FAQ", error: error.message });
  }
};
