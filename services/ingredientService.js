const Ingredients = require("../models/Ingredient");
const jwt = require("jsonwebtoken");
const UserModel = require("../models/UserModel");

exports.createIngredient = async (data) => {
  const existingIngredient = await Ingredients.findOne({ 
    name: data.name, 
    isDelete: false 
  });
  if (existingIngredient) {
    throw Object.assign(new Error("Ingredient with this name already exists"), { status: 400 });
  }
  const newIngredient = new Ingredients(data);
  return await newIngredient.save();
};

exports.createManyIngredients = async (ingredients) => {
  if (!Array.isArray(ingredients)) throw new Error("Input should be an array of ingredients");
  return await Ingredients.insertMany(ingredients);
};

exports.getAllIngredients = async (query, token) => {
  const {
    page = 1,
    limit = 10,
    type = "all",
    search = "",
    sort = "createdAt",
    order = "desc",
  } = query;
  let filter = { isDelete: false, isVisible: true }; // Default filter for all roles except nutritionist

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      const user = await UserModel.findById(decoded.id);
      
      if (user && user.role === "nutritionist") {
        filter = { isDelete: false }; // Only for nutritionist
      }
      // No else needed, default filter already set for other roles
    } catch (error) {
      console.error("Invalid token:", error.message);
    }
  }

  if (type !== "all") filter.type = type;
  if (search) filter.name = { $regex: search, $options: "i" };

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;
  const sortOrder = order === "desc" ? -1 : 1;
  const sortOptions = { [sort]: sortOrder };

  const totalItems = await Ingredients.countDocuments(filter);
  const ingredients = await Ingredients.find(filter)
    .sort(sortOptions)
    .skip(skip)
    .limit(limitNum)
    .lean();

  return {
    items: ingredients,
    total: totalItems,
    currentPage: pageNum,
    totalPages: Math.ceil(totalItems / limitNum),
  };
};

exports.getIngredientById = async (ingredientId) => {
  const ingredient = await Ingredients.findById(ingredientId);
  if (!ingredient) throw Object.assign(new Error("Ingredient not found"), { status: 404 });
  return ingredient;
};

exports.updateIngredient = async (ingredientId, data) => {
  const updatedIngredient = await Ingredients.findByIdAndUpdate(ingredientId, data, { new: true });
  if (!updatedIngredient) throw Object.assign(new Error("Ingredient not found"), { status: 404 });
  return updatedIngredient;
};

exports.deleteIngredient = async (ingredientId) => {
  const updatedIngredient = await Ingredients.findByIdAndUpdate(
    ingredientId,
    { isDelete: true },
    { new: true }
  );
  if (!updatedIngredient) throw Object.assign(new Error("Ingredient not found"), { status: 404 });
  return updatedIngredient;
};

exports.hideIngredient = async (ingredientId) => {
  const hiddenIngredient = await Ingredients.findByIdAndUpdate(
    ingredientId,
    { isVisible: false },
    { new: true, runValidators: true }
  );
  if (!hiddenIngredient) throw Object.assign(new Error("Ingredient not found"), { status: 404 });
  return hiddenIngredient;
};

exports.searchIngredientsByName = async (query) => {
  const { name, page = 1, limit = 10 } = query;
  if (!name) throw Object.assign(new Error("Name query parameter is required"), { status: 400 });

  const filter = { name: { $regex: name, $options: "i" }, isDelete: false };
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const totalItems = await Ingredients.countDocuments(filter);
  const ingredients = await Ingredients.find(filter).skip(skip).limit(limitNum).lean();

  if (ingredients.length === 0)
    throw Object.assign(new Error("Ingredient not found"), { status: 404 });

  return {
    items: ingredients,
    total: totalItems,
    currentPage: pageNum,
    totalPages: Math.ceil(totalItems / limitNum),
  };
};

exports.filterIngredientsByType = async (query) => {
  const { type, page = 1, limit = 10 } = query;
  if (!type) throw Object.assign(new Error("Type query parameter is required"), { status: 400 });

  const filter = { type, isDelete: false };
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const totalItems = await Ingredients.countDocuments(filter);
  const ingredients = await Ingredients.find(filter).skip(skip).limit(limitNum).lean();

  return {
    items: ingredients,
    total: totalItems,
    currentPage: pageNum,
    totalPages: Math.ceil(totalItems / limitNum),
  };
};
