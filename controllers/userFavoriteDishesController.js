const favoriteDishService = require("../services/favoriteDishService");

exports.addFavoriteDish = async (req, res) => {
  try {
    const { userId, dishId } = req.body;
    const favoriteDish = await favoriteDishService.addFavoriteDish(userId, dishId);
    res.status(201).json({ status: "success", data: favoriteDish });
  } catch (error) {
    res.status(error.status || 500).json({ status: "fail", message: error.message });
  }
};

exports.getUserFavoriteDishes = async (req, res) => {
  try {
    const { userId } = req.params;
    const favorites = await favoriteDishService.getUserFavoriteDishes(userId);
    res.status(200).json({ status: "success", data: favorites });
  } catch (error) {
    res.status(error.status || 500).json({ status: "fail", message: error.message });
  }
};

exports.checkFavoriteDish = async (req, res) => {
  try {
    const { userId, dishId } = req.params;
    const isFavorite = await favoriteDishService.checkFavoriteDish(userId, dishId);
    res.status(200).json({ status: "success", isFavorite });
  } catch (error) {
    res.status(error.status || 500).json({ status: "fail", message: error.message });
  }
};

exports.removeFavoriteDish = async (req, res) => {
  try {
    const { userId, dishId } = req.body;
    const result = await favoriteDishService.removeFavoriteDish(userId, dishId);
    res
      .status(200)
      .json({ status: "success", message: "Đã xóa khỏi danh sách yêu thích", data: result });
  } catch (error) {
    res.status(error.status || 500).json({ status: "fail", message: error.message });
  }
};
