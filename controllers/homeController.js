const Ingredients = require("../models/Ingredient");
const Dishes = require("../models/Dish");

exports.getIngredientsGroupedByType = async (req, res) => {
  try {
    const groupedIngredients = await Ingredients.aggregate([
      { $match: { isDelete: false } }, // Chỉ lấy những ingredient chưa bị xóa
      {
        $group: {
          _id: "$type", // Nhóm theo `type`
          ingredients: { $push: "$$ROOT" }, // Đưa toàn bộ document vào nhóm
        },
      }
    ]);

    res.status(200).json({ status: "success", data: groupedIngredients });
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
};

// ✅ API lấy danh sách nguyên liệu theo `type`
exports.getIngredientsByType = async (req, res) => {
  try {
    const { type } = req.params;
    const ingredients = await Ingredients.find({ type, isDelete: false });

    if (ingredients.length === 0) {
      return res.status(404).json({ status: "fail", message: "No ingredients found for this type" });
    }

    res.status(200).json({ status: "success", data: ingredients });
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
};

exports.getDishGroupedByType = async (req, res) => {
  try {
    const groupedDishTypes = await Dishes.aggregate([
      { $match: { isDelete: false } }, // Chỉ lấy những ingredient chưa bị xóa
      {
        $group: {
          _id: "$type", // Nhóm theo `type`
          dishes: { $push: "$$ROOT" }, // Đưa toàn bộ document vào nhóm
        },
      }
    ]);

    res.status(200).json({ status: "success", data: groupedDishTypes });
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
};

exports.getDishByType = async (req, res) => {
  try {
    const { type } = req.params;
    const dishes = await Dishes.find({ type, isDelete: false });

    if (dishes.length === 0) {
      return res.status(404).json({ status: "fail", message: "No dishes found for this type" });
    }

    res.status(200).json({ status: "success", data: dishes });
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
};