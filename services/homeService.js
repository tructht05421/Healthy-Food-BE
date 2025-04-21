const Ingredients = require("../models/Ingredient");
const Dishes = require("../models/Dish");

// === Ingredients Services ===
// Lấy danh sách nguyên liệu nhóm theo type
exports.getIngredientsGroupedByType = async () => {
  try {
    const groupedIngredients = await Ingredients.aggregate([
      { $match: { isDelete: false } }, // Chỉ lấy những ingredient chưa bị xóa
      {
        $group: {
          _id: "$type", // Nhóm theo `type`
          ingredients: { $push: "$$ROOT" }, // Đưa toàn bộ document vào nhóm
        },
      },
    ]);

    return { status: "success", data: groupedIngredients };
  } catch (error) {
    throw new Error(error.message);
  }
};

// Lấy danh sách nguyên liệu theo type
exports.getIngredientsByType = async (type) => {
  try {
    const ingredients = await Ingredients.find({ type, isDelete: false });

    if (ingredients.length === 0) {
      return { status: "fail", message: "No ingredients found for this type" };
    }

    return { status: "success", data: ingredients };
  } catch (error) {
    throw new Error(error.message);
  }
};

// === Dishes Services ===
// Lấy danh sách món ăn nhóm theo type
exports.getDishGroupedByType = async () => {
  try {
    const groupedDishTypes = await Dishes.aggregate([
      { $match: { isDelete: false } }, // Chỉ lấy những món ăn chưa bị xóa
      {
        $group: {
          _id: "$type", // Nhóm theo `type`
          dishes: { $push: "$$ROOT" }, // Đưa toàn bộ document vào nhóm
        },
      },
    ]);

    return { status: "success", data: groupedDishTypes };
  } catch (error) {
    throw new Error(error.message);
  }
};

// Lấy danh sách món ăn theo type
exports.getDishByType = async (type) => {
  try {
    const dishes = await Dishes.find({ type, isDelete: false });

    if (dishes.length === 0) {
      return { status: "fail", message: "No dishes found for this type" };
    }

    return { status: "success", data: dishes };
  } catch (error) {
    throw new Error(error.message);
  }
};
