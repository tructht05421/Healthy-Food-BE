const homeService = require("../services/homeService");

// === Ingredients Controllers ===
// Lấy danh sách nguyên liệu nhóm theo type
exports.getIngredientsGroupedByType = async (req, res) => {
  try {
    const result = await homeService.getIngredientsGroupedByType();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
};

// Lấy danh sách nguyên liệu theo type
exports.getIngredientsByType = async (req, res) => {
  try {
    const result = await homeService.getIngredientsByType(req.params.type);
    if (!result.data.length) {
      return res.status(404).json(result); // Trả về lỗi 404 nếu không tìm thấy
    }
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
};

// === Dishes Controllers ===
// Lấy danh sách món ăn nhóm theo type
exports.getDishGroupedByType = async (req, res) => {
  try {
    const result = await homeService.getDishGroupedByType();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
};

// Lấy danh sách món ăn theo type
exports.getDishByType = async (req, res) => {
  try {
    const result = await homeService.getDishByType(req.params.type);
    if (!result.data.length) {
      return res.status(404).json(result); // Trả về lỗi 404 nếu không tìm thấy
    }
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
};
