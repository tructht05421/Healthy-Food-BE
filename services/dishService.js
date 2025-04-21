const Dish = require("../models/Dish");
const Recipe = require("../models/Recipe");
const jwt = require("jsonwebtoken");
const UserModel = require("../models/UserModel");

exports.createDish = async (data) => {
  const existingDish = await Dish.findOne({
    name: data.name,
    isDelete: false,
  });

  if (existingDish) {
    throw Object.assign(new Error("Dish with this name already exists"), { status: 400 });
  }

  const newDish = new Dish(data);
  return await newDish.save();
};

exports.createManyDishes = async (dishes) => {
  if (!Array.isArray(dishes) || dishes.length === 0) {
    throw new Error("Input should be a non-empty array of dishes");
  }
  return await Dish.insertMany(dishes);
};

exports.getAllDishes = async (query) => {
  const {
    page = 1,
    limit = 10,
    type = "all",
    search = "",
    sort = "createdAt",
    order = "desc",
  } = query;
  let filter = { isDelete: false, isVisible: true };

  // Lọc theo type
  if (type !== "all") {
    filter.type = { $regex: `^${type}$`, $options: "i" }; // Khớp chính xác, không phân biệt hoa thường
  }

  // Lọc theo search
  if (search) {
    filter.name = { $regex: search, $options: "i" };
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;
  const sortOrder = order === "desc" ? -1 : 1;
  const sortOptions = { [sort]: sortOrder };

  const totalItems = await Dish.countDocuments(filter);
  const dishes = await Dish.find(filter).sort(sortOptions).skip(skip).limit(limitNum).lean();

  return {
    items: dishes,
    total: totalItems,
    currentPage: pageNum,
    totalPages: Math.ceil(totalItems / limitNum),
  };
};
// New service for searchDishByName
exports.searchDishByName = async (query) => {
  const { name = "", page = 1, limit = 10, sort = "createdAt", order = "desc" } = query;
  let filter = { isDelete: false, isVisible: true }; // Default filter

  // If name is provided, search for dishes with matching names (case-insensitive)
  if (name) {
    filter.name = { $regex: name, $options: "i" };
  } else {
    throw new Error("Search term 'name' is required");
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;
  const sortOrder = order === "desc" ? -1 : 1;
  const sortOptions = { [sort]: sortOrder };

  const totalItems = await Dish.countDocuments(filter);
  const dishes = await Dish.find(filter).sort(sortOptions).skip(skip).limit(limitNum).lean();

  return {
    items: dishes,
    total: totalItems,
    currentPage: pageNum,
    totalPages: Math.ceil(totalItems / limitNum),
  };
};

// In dishService.js
// dishService.js
exports.getDishesBySeason = async (query) => {
  const { season, page = 1, limit = 10, sort = "createdAt", order = "desc" } = query;

  // Tạo bộ lọc: chỉ lọc theo season, isDelete, và isVisible
  let filter = {
    season: { $regex: `^${season}$`, $options: "i" }, // Case-insensitive match
    isDelete: false,
    isVisible: true,
  };

  // Xử lý phân trang và sắp xếp
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;
  const sortOrder = order === "desc" ? -1 : 1;
  const sortOptions = { [sort]: sortOrder };

  // Truy vấn database
  const totalItems = await Dish.countDocuments(filter);
  const dishes = await Dish.find(filter).sort(sortOptions).skip(skip).limit(limitNum).lean();

  // Tạo response
  const response = {
    items: dishes,
    total: totalItems,
    currentPage: pageNum,
    totalPages: Math.ceil(totalItems / limitNum),
  };

  // Thêm thông báo nếu không tìm thấy kết quả
  if (totalItems === 0) {
    response.message = `No dishes found for season '${season}'`;
  }

  return response;
};

exports.getAllDishesForNutri = async (query) => {
  const { page = 1, limit = 10, search = "", sort = "createdAt", order = "desc" } = query;
  let filter = { isDelete: false }; // Filter for nutritionists

  if (search) filter.name = { $regex: search, $options: "i" };

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;
  const sortOrder = order === "desc" ? -1 : 1;
  const sortOptions = { [sort]: sortOrder };

  const totalItems = await Dish.countDocuments(filter);
  const dishes = await Dish.find(filter).sort(sortOptions).skip(skip).limit(limitNum).lean();

  return {
    items: dishes,
    total: totalItems,
    currentPage: pageNum,
    totalPages: Math.ceil(totalItems / limitNum),
  };
};

exports.getDishById = async (dishId) => {
  const dish = await Dish.findOne({ _id: dishId, isDelete: false, isVisible: true });
  if (!dish) throw Object.assign(new Error("Dish not found"), { status: 404 });
  return dish;
};

exports.getDishByType = async (type, query) => {
  const { page = 1, limit = 10, sort = "createdAt", order = "desc" } = query;

  // Ensure type is case-insensitive
  const filter = {
    type: { $regex: `^${type}$`, $options: "i" }, // Exact match, case-insensitive
    isDelete: false,
    isVisible: true,
  };

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;
  const sortOrder = order === "desc" ? -1 : 1;
  const sortOptions = { [sort]: sortOrder };

  const totalItems = await Dish.countDocuments(filter);
  const dishes = await Dish.find(filter).sort(sortOptions).skip(skip).limit(limitNum).lean();

  return {
    items: dishes,
    total: totalItems,
    currentPage: pageNum,
    totalPages: Math.ceil(totalItems / limitNum),
  };
};

exports.updateDish = async (dishId, data) => {
  const updatedDish = await Dish.findByIdAndUpdate(dishId, data, { new: true });
  if (!updatedDish) throw Object.assign(new Error("Dish not found"), { status: 404 });
  return updatedDish;
};

exports.deleteDish = async (dishId) => {
  const updatedDish = await Dish.findByIdAndUpdate(dishId, { isDelete: true }, { new: true });
  if (!updatedDish) throw Object.assign(new Error("Dish not found"), { status: 404 });
  return updatedDish;
};

exports.hideDish = async (dishId) => {
  const hiddenDish = await Dish.findByIdAndUpdate(
    dishId,
    { isVisible: false },
    { new: true, runValidators: true }
  );
  if (!hiddenDish) throw Object.assign(new Error("Dish not found"), { status: 404 });
  if (hiddenDish.recipeId)
    await Recipe.findByIdAndUpdate(hiddenDish.recipeId, { isVisible: false });
  return hiddenDish;
};
