const Recipe = require("../models/Recipe");
const Dish = require("../models/Dish");
const Ingredient = require("../models/Ingredient");
const jwt = require("jsonwebtoken");
const UserModel = require("../models/UserModel");

exports.getAllRecipes = async (query, token) => {
  const { page = 1, limit = 10 } = query;
  let filter = { isDelete: false };

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      const user = await UserModel.findById(decoded.id);
      if (user && (user.role === "admin" || user.role === "nutritionist")) {
        filter = {};
      }
    } catch (error) {
      console.error("Invalid token:", error.message);
    }
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const totalItems = await Recipe.countDocuments(filter);
  const recipes = await Recipe.find(filter)
    .populate("dishId")
    .populate("ingredients.ingredientId")
    .skip(skip)
    .limit(limitNum)
    .lean();

  return {
    items: recipes,
    total: totalItems,
    currentPage: pageNum,
    totalPages: Math.ceil(totalItems / limitNum),
  };
};

exports.createRecipe = async (dishId, data) => {
  // Validate dish
  const dish = await Dish.findById(dishId);
  if (!dish) throw Object.assign(new Error("Dish not found"), { status: 404 });

  // Validate ingredients
  if (!data.ingredients || data.ingredients.length === 0) {
    throw Object.assign(new Error("At least one ingredient is required"), { status: 400 });
  }

  // Validate instructions
  if (!data.instruction || data.instruction.length === 0) {
    throw Object.assign(new Error("At least one instruction is required"), { status: 400 });
  }
  for (const inst of data.instruction) {
    if (!inst.step || typeof inst.step !== "number" || inst.step <= 0) {
      throw Object.assign(new Error("Each instruction must have a valid step number"), {
        status: 400,
      });
    }
    if (
      !inst.description ||
      typeof inst.description !== "string" ||
      inst.description.trim() === ""
    ) {
      throw Object.assign(new Error("Each instruction must have a valid description"), {
        status: 400,
      });
    }
  }

  // Calculate nutritional data
  let totalCalories = 0,
    totalProtein = 0,
    totalCarbs = 0,
    totalFat = 0;

  for (const ingredientItem of data.ingredients) {
    const ingredientInfo = await Ingredient.findById(ingredientItem.ingredientId);
    if (!ingredientInfo) {
      throw Object.assign(
        new Error(`Ingredient with ID ${ingredientItem.ingredientId} not found`),
        { status: 404 }
      );
    }

    let conversionFactor = ingredientItem.quantity / 100;
    if (ingredientItem.unit === "tbsp") conversionFactor = (ingredientItem.quantity * 15) / 100;
    if (ingredientItem.unit === "tsp" || ingredientItem.unit === "tp")
      conversionFactor = (ingredientItem.quantity * 5) / 100;

    totalCalories += (ingredientInfo.calories || 0) * conversionFactor;
    totalProtein += (ingredientInfo.protein || 0) * conversionFactor;
    totalCarbs += (ingredientInfo.carbs || 0) * conversionFactor;
    totalFat += (ingredientInfo.fat || 0) * conversionFactor;
  }

  totalCalories = Math.round(totalCalories * 100) / 100;
  totalProtein = Math.round(totalProtein * 100) / 100;
  totalCarbs = Math.round(totalCarbs * 100) / 100;
  totalFat = Math.round(totalFat * 100) / 100;

  // Map description to description
  const formattedInstruction = data.instruction.map((inst) => ({
    step: inst.step,
    description: inst.description,
  }));

  // Prepare recipe data
  const recipeData = {
    ...data,
    dishId,
    instruction: formattedInstruction,
    totalCalories,
    totalProtein,
    totalCarbs,
    totalFat,
  };

  const newRecipe = await Recipe.create(recipeData);

  // Update dish
  dish.recipeId = newRecipe._id;
  dish.calories = totalCalories;
  dish.protein = totalProtein;
  dish.carbs = totalCarbs;
  dish.fat = totalFat;
  if (data.totalServing) dish.totalServing = data.totalServing;
  if (data.cookingTime) dish.cookingTime = data.cookingTime;
  await dish.save();

  return {
    recipe: newRecipe,
    nutritionInfo: {
      calories: totalCalories,
      protein: totalProtein,
      carbs: totalCarbs,
      fat: totalFat,
    },
  };
};

exports.updateRecipeById = async (recipeId, data) => {
  const recipe = await Recipe.findById(recipeId);
  if (!recipe) throw Object.assign(new Error("Recipe not found"), { status: 404 });

  // Validate ingredients if provided
  if (data.ingredients && data.ingredients.length === 0) {
    throw Object.assign(new Error("At least one ingredient is required"), { status: 400 });
  }

  // Validate instructions if provided
  if (data.instruction && data.instruction.length === 0) {
    throw Object.assign(new Error("At least one instruction is required"), { status: 400 });
  }
  if (data.instruction) {
    for (const inst of data.instruction) {
      if (!inst.step || typeof inst.step !== "number" || inst.step <= 0) {
        throw Object.assign(new Error("Each instruction must have a valid step number"), {
          status: 400,
        });
      }
      if (
        !inst.description ||
        typeof inst.description !== "string" ||
        inst.description.trim() === ""
      ) {
        throw Object.assign(new Error("Each instruction must have a valid description"), {
          status: 400,
        });
      }
    }
  }

  // Calculate nutritional data if ingredients are provided
  let totalCalories, totalProtein, totalCarbs, totalFat;
  if (data.ingredients) {
    totalCalories = 0;
    totalProtein = 0;
    totalCarbs = 0;
    totalFat = 0;

    for (const ingredientItem of data.ingredients) {
      const ingredientInfo = await Ingredient.findById(ingredientItem.ingredientId);
      if (!ingredientInfo) {
        throw Object.assign(
          new Error(`Ingredient with ID ${ingredientItem.ingredientId} not found`),
          { status: 404 }
        );
      }

      let conversionFactor = ingredientItem.quantity / 100;
      if (ingredientItem.unit === "tbsp") conversionFactor = (ingredientItem.quantity * 15) / 100;
      if (ingredientItem.unit === "tsp" || ingredientItem.unit === "tp")
        conversionFactor = (ingredientItem.quantity * 5) / 100;

      totalCalories += (ingredientInfo.calories || 0) * conversionFactor;
      totalProtein += (ingredientInfo.protein || 0) * conversionFactor;
      totalCarbs += (ingredientInfo.carbs || 0) * conversionFactor;
      totalFat += (ingredientInfo.fat || 0) * conversionFactor;
    }

    totalCalories = Math.round(totalCalories * 100) / 100;
    totalProtein = Math.round(totalProtein * 100) / 100;
    totalCarbs = Math.round(totalCarbs * 100) / 100;
    totalFat = Math.round(totalFat * 100) / 100;
  }

  // Map description to description
  const formattedInstruction = data.instruction
    ? data.instruction.map((inst) => ({
        step: inst.step,
        description: inst.description,
      }))
    : undefined;

  // Prepare update data
  const updateData = {
    ...data,
    instruction: formattedInstruction,
    totalCalories,
    totalProtein,
    totalCarbs,
    totalFat,
  };

  // Remove undefined fields to avoid overwriting with undefined
  Object.keys(updateData).forEach((key) => updateData[key] === undefined && delete updateData[key]);

  const updatedRecipe = await Recipe.findByIdAndUpdate(recipeId, updateData, {
    new: true,
    runValidators: true,
  });
  if (!updatedRecipe) throw Object.assign(new Error("Recipe not found"), { status: 404 });

  // Update dish
  const dish = await Dish.findById(updatedRecipe.dishId);
  if (dish) {
    dish.calories = updatedRecipe.totalCalories;
    dish.protein = updatedRecipe.totalProtein;
    dish.carbs = updatedRecipe.totalCarbs;
    dish.fat = updatedRecipe.totalFat;
    if (data.totalServing) dish.totalServing = data.totalServing;
    if (data.cookingTime) dish.cookingTime = data.cookingTime;
    await dish.save();
  }

  return updatedRecipe;
};

exports.getRecipeById = async (dishId, recipeId) => {
  const recipe = await Recipe.findById(recipeId)
    .populate("dishId")
    .populate({ path: "ingredients.ingredientId", match: { isDelete: false, isVisible: true } });

  if (!recipe) throw Object.assign(new Error("Recipe not found"), { status: 404 });
  if (!recipe.dishId) throw Object.assign(new Error("Associated dish not found"), { status: 404 });
  if (recipe.dishId._id.toString() !== dishId) {
    throw Object.assign(new Error("Dish ID does not match the recipe's associated dish"), {
      status: 404,
    });
  }
  if (recipe.dishId.isDelete || !recipe.dishId.isVisible) {
    throw Object.assign(new Error("Associated dish is deleted or hidden"), { status: 404 });
  }

  recipe.ingredients = recipe.ingredients.filter((ing) => ing.ingredientId);
  return recipe;
};

exports.deleteRecipeById = async (recipeId) => {
  const recipe = await Recipe.findByIdAndDelete(recipeId);
  if (!recipe) throw Object.assign(new Error("Công thức không tồn tại"), { status: 404 });

  const dish = await Dish.findById(recipe.dishId);
  if (dish) {
    dish.recipeId = null;
    dish.cookingTime = 0;
    dish.calories = 0;
    dish.protein = 0;
    dish.carbs = 0;
    dish.fat = 0;
    dish.totalServing = 0;
    await dish.save();
  }
};

exports.getRecipeByDishId = async (recipeId) => {
  const recipe = await Recipe.findById(recipeId)
    .populate("dishId")
    .populate("ingredients.ingredientId")
    .lean();
  if (!recipe) throw Object.assign(new Error("Recipe not found"), { status: 404 });
  if (recipe.dishId?.isDelete || !recipe.dishId?.isVisible) {
    throw Object.assign(new Error("Associated dish is deleted or hidden"), { status: 404 });
  }
  return recipe;
};
