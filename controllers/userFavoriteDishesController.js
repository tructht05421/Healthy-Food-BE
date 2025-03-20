const UserFavoriteDishes = require("../models/UserFavoriteDishes");

// 🟢 Thêm món ăn yêu thích
exports.addFavoriteDish = async (req, res) => {
  try {
    const { userId, dishId } = req.body;

    if (!userId || !dishId) {
      return res.status(400).json({ status: "fail", message: "userId và dishId là bắt buộc" });
    }

    const favoriteDish = await UserFavoriteDishes.create({ userId, dishId, isLike: true });

    res.status(201).json({ status: "success", data: favoriteDish });
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
};

// 🟢 Lấy danh sách món ăn yêu thích của người dùng
exports.getUserFavoriteDishes = async (req, res) => {
  try {
    const { userId } = req.params;

    const favorites = await UserFavoriteDishes.find({ userId, isLike: true })
      .populate("dishId", "name image description") // Lấy thông tin món ăn
      .sort({ createdAt: -1 });

    res.status(200).json({ status: "success", data: favorites });
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
};

// 🟢 Kiểm tra xem món ăn có trong danh sách yêu thích không
exports.checkFavoriteDish = async (req, res) => {
  try {
    const { userId, dishId } = req.params;

    const favorite = await UserFavoriteDishes.findOne({ userId, dishId, isLike: true });

    res.status(200).json({ status: "success", isFavorite: !!favorite });
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
};

// 🟢 Xóa món ăn khỏi danh sách yêu thích (hoặc đánh dấu isLike = false)
exports.removeFavoriteDish = async (req, res) => {
  try {
    const { userId, dishId } = req.body;

    // Cập nhật tất cả bản ghi có userId và dishId thành isLike: false
    const result = await UserFavoriteDishes.updateMany(
      { userId, dishId },
      { $set: { isLike: false } }
    );

    // Nếu không tìm thấy bản ghi nào, trả về lỗi
    if (result.matchedCount === 0) {
      return res.status(404).json({ status: "fail", message: "Món ăn không tồn tại trong danh sách yêu thích" });
    }

    res.status(200).json({ status: "success", message: "Đã xóa khỏi danh sách yêu thích", data: result });
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
};

