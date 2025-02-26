const Dish = require("../models/Dish");
const Ingredients = require("../models/Ingredient");
const Recipe = require("../models/Recipe");

// Dish CRUD Operations

// Create Dish
exports.createDish = async (req, res) => {
  try {
    const newDish = new Dish(req.body);
    await newDish.save();
    res.status(201).json({ status: "success", data: newDish });
  } catch (error) {
    res.status(400).json({ status: "fail", message: error.message });
  }
};

// Read all Dishes
exports.getAllDishes = async (req, res) => {
  try {
    const dishes = await Dish.find({ isDelete: false }).populate({
      path: "recipe_id",
      populate: {
        path: "ingredients.ingredient_id",
      },
    });
    res.status(200).json({ status: "success", data: dishes });
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
};

// Read Dish by ID
exports.getDishById = async (req, res) => {
  try {
    const dish = await Dish.findById(req.params.dishId);
    if (!dish)
      return res
        .status(404)
        .json({ status: "fail", message: "Dish not found" });
    res.status(200).json({ status: "success", data: dish });
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
};

// Update Dish
exports.updateDish = async (req, res) => {
  try {
    const updatedDish = await Dish.findByIdAndUpdate(
      req.params.dishId,
      req.body,
      { new: true }
    );
    if (!updatedDish)
      return res
        .status(404)
        .json({ status: "fail", message: "Dish not found" });
    res.status(200).json({ status: "success", data: updatedDish });
  } catch (error) {
    res.status(400).json({ status: "fail", message: error.message });
  }
};

// Delete Dish
exports.deleteDish = async (req, res) => {
  try {
    const deletedDish = await Dish.findByIdAndUpdate(
      req.params.dishId,
      { isDelete: true },
      { new: true }
    );
    if (!deletedDish)
      return res
        .status(404)
        .json({ status: "fail", message: "Dish not found" });
    res
      .status(200)
      .json({ status: "success", message: "Dish marked as deleted" });
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
};

// Ingredients CRUD Operations

// Create Ingredients
exports.createIngredient = async (req, res) => {
  try {
    const newIngredient = new Ingredients(req.body);
    await newIngredient.save();
    res.status(201).json({ status: "success", data: newIngredient });
  } catch (error) {
    res.status(400).json({ status: "fail", message: error.message });
  }
};

// Create many Ingredients
exports.createManyIngredients = async (req, res) => {
  try {
    const ingredients = req.body; // Nhận mảng các nguyên liệu từ request body

    // Kiểm tra xem ingredients có phải là mảng không
    if (!Array.isArray(ingredients)) {
      return res.status(400).json({
        status: "fail",
        message: "Input should be an array of ingredients",
      });
    }

    // Tạo các nguyên liệu và lưu vào database
    const createdIngredients = await Ingredients.insertMany(ingredients);

    // Trả về kết quả
    res.status(201).json({ status: "success", data: createdIngredients });
  } catch (error) {
    res.status(400).json({ status: "fail", message: error.message });
  }
};

// Read all Ingredients
exports.getAllIngredients = async (req, res) => {
  try {
    const ingredients = await Ingredients.find({ isDelete: false });
    res.status(200).json({ status: "success", data: ingredients });
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
};

// Read Ingredient by ID
exports.getIngredientById = async (req, res) => {
  try {
    const ingredient = await Ingredients.findById(req.params.ingredientId);
    if (!ingredient)
      return res
        .status(404)
        .json({ status: "fail", message: "Ingredient not found" });

    res.status(200).json({ status: "success", data: ingredient });
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
};

// Update Ingredient
exports.updateIngredient = async (req, res) => {
  try {
    const updatedIngredient = await Ingredients.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
      }
    );
    if (!updatedIngredient)
      return res
        .status(404)
        .json({ status: "fail", message: "Ingredient not found" });

    res.status(200).json({ status: "success", data: updatedIngredient });
  } catch (error) {
    res.status(400).json({ status: "fail", message: error.message });
  }
};

// Delete Ingredient
exports.deleteIngredient = async (req, res) => {
  try {
    const deletedIngredient = await Ingredients.findByIdAndUpdate(
      req.params.ingredientId,
      { isDelete: true },
      { new: true }
    );
    if (!deletedIngredient)
      return res
        .status(404)
        .json({ status: "fail", message: "Ingredient not found" });

    res
      .status(200)
      .json({ status: "success", message: "Ingredient marked as deleted" });
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
};

// Search Ingredients by name
exports.searchIngredientsByName = async (req, res) => {
  try {
    const { name } = req.query;
    if (!name) {
      return res
        .status(400)
        .json({ status: "fail", message: "Name query parameter is required" });
    }

    const ingredients = await Ingredients.find({
      name: { $regex: name, $options: "i" },
      isDelete: false,
    });

    if (ingredients.length === 0) {
      return res
        .status(404)
        .json({ status: "fail", message: "Ingredient not found" });
    }

    res.status(200).json({ status: "success", data: ingredients });
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
};

// Filter Ingredients by type
exports.filterIngredientsByType = async (req, res) => {
  try {
    const { type } = req.query;
    if (!type) {
      return res
        .status(400)
        .json({ status: "fail", message: "Type query parameter is required" });
    }

    const ingredients = await Ingredients.find({
      type: type,
      isDelete: false,
    });

    res.status(200).json({ status: "success", data: ingredients });
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
};

// Recipe CRUD Operations

// Create Recipe
exports.createRecipe = async (req, res) => {
  try {
    const { dish_id, ingredients, total_servings } = req.body;

    // Kiểm tra xem dish_id có tồn tại không
    const dish = await Dish.findById(dish_id);
    if (!dish) {
      return res
        .status(404)
        .json({ status: "fail", message: "Dish not found" });
    }

    // Kiểm tra xem tất cả các ingredients có tồn tại không
    const ingredientsExist = await Ingredients.find({
      _id: { $in: ingredients.map((ing) => ing.ingredient_id) },
    });
    if (ingredientsExist.length !== ingredients.length) {
      return res
        .status(404)
        .json({ status: "fail", message: "One or more ingredients not found" });
    }

    // Tạo recipe mới
    const newRecipe = new Recipe({
      dish_id,
      ingredients,
      total_servings,
    });

    await newRecipe.save();

    // Cập nhật recipe_id trong Dish
    dish.recipe_id = newRecipe._id;
    await dish.save();

    res.status(201).json({ status: "success", data: newRecipe });
  } catch (error) {
    res.status(400).json({ status: "fail", message: error.message });
  }
};

// Read all Recipes
exports.getAllRecipes = async (req, res) => {
  try {
    const recipes = await Recipe.find()
      .populate("dish_id ingredients.ingredient_id")
      .where("isDelete")
      .equals(false); // Only fetch non-deleted recipes

    res.status(200).json({ status: "success", data: recipes });
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
};

// Read Recipe by ID
exports.getRecipeById = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.recipeId).populate(
      "ingredients.ingredient_id"
    );
    if (!recipe) {
      return res
        .status(404)
        .json({ status: "fail", message: "Recipe not found" });
    }
    res.status(200).json({ status: "success", data: recipe });
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
};

// Update Recipe
exports.updateRecipe = async (req, res) => {
  try {
    const updatedRecipe = await Recipe.findByIdAndUpdate(
      req.params.recipeId,
      req.body,
      {
        new: true,
      }
    );
    if (!updatedRecipe) {
      return res
        .status(404)
        .json({ status: "fail", message: "Recipe not found" });
    }
    res.status(200).json({ status: "success", data: updatedRecipe });
  } catch (error) {
    res.status(400).json({ status: "fail", message: error.message });
  }
};
