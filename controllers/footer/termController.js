const jwt = require("jsonwebtoken");
const TermOfUse = require("../../models/footer/Term");
const UserModel = require("../../models/UserModel");

// 🔹 Lấy tất cả Terms
exports.getAllTerms = async (req, res) => {
  try {
    let filter = { isDeleted: false, isVisible: true };

    // Lấy token từ request (cookie hoặc header)
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

    if (token) {
      try {
        // Giải mã token lấy user ID
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        const user = await UserModel.findById(decoded.id);

        if (user && (user.role === "admin" || user.role === "nutritionist")) {
          filter = {}; // Admin/Nutritionist thấy tất cả Terms
        }
      } catch (error) {
        console.error("❌ Lỗi xác thực token:", error.message);
      }
    }

    // Lấy danh sách Terms
    const terms = await TermOfUse.find(filter).select("_id bannerUrl content isVisible");

    res.status(200).json({ success: true, data: terms });
  } catch (error) {
    console.error("❌ Lỗi khi lấy Terms:", error);
    res.status(500).json({ success: false, message: "Lỗi lấy dữ liệu Terms" });
  }
};

// 🔹 Tạo mới Term
exports.createTerm = async (req, res) => {
  try {
    console.log("📤 Dữ liệu nhận từ client:", req.body);

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ success: false, message: "Body request rỗng!" });
    }

    const { bannerUrl, content } = req.body;
    if (!bannerUrl || !content) {
      return res.status(400).json({ success: false, message: "Thiếu dữ liệu đầu vào!" });
    }

    const newTerm = await TermOfUse.create({ bannerUrl, content });

    res.status(201).json({ success: true, data: newTerm });
  } catch (error) {
    console.error("❌ Lỗi tạo Terms:", error);
    res.status(500).json({ success: false, message: "Lỗi tạo Terms" });
  }
};

// 🔹 Cập nhật Term
exports.updateTerm = async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ success: false, message: "ID không hợp lệ" });

  try {
    console.log(`📤 Cập nhật Term ID: ${id}`, req.body);

    const updatedTerm = await TermOfUse.findByIdAndUpdate(id, req.body, { new: true });

    if (!updatedTerm) {
      return res.status(404).json({ success: false, message: "Không tìm thấy Term" });
    }

    res.status(200).json({ success: true, data: updatedTerm });
  } catch (error) {
    console.error("❌ Lỗi cập nhật Terms:", error);
    res.status(500).json({ success: false, message: "Lỗi cập nhật Terms" });
  }
};

// 🔹 Xóa vĩnh viễn Term
exports.hardDeleteTerm = async (req, res) => {
  const { id } = req.params;
  try {
    console.log(`🗑️ Xóa vĩnh viễn Term ID: ${id}`);

    await TermOfUse.findByIdAndDelete(id);

    res.status(200).json({ success: true, message: "Terms đã bị xóa vĩnh viễn" });
  } catch (error) {
    console.error("❌ Lỗi xóa Terms:", error);
    res.status(500).json({ success: false, message: "Lỗi xóa cứng Terms" });
  }
};
