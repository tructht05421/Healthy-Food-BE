const recipeService = require("../services/recipeService");

exports.getAllRecipes = async (req, res) => {
  try {
    const result = await recipeService.getAllRecipes(
      req.query,
      req.cookies.token || req.headers.authorization?.split(" ")[1]
    );
    res.status(200).json({ status: "success", data: result });
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
};

exports.createRecipe = async (req, res) => {
  try {
    const result = await recipeService.createRecipe(
      req.params.dishId,
      req.body,
      req.cookies.token || req.headers.authorization?.split(" ")[1]
    );
    res
      .status(201)
      .json({ status: "success", data: result.recipe, nutritionInfo: result.nutritionInfo });
  } catch (error) {
    res.status(error.status || 400).json({ status: "fail", message: error.message });
  }
};

exports.getRecipeById = async (req, res) => {
  try {
    const recipe = await recipeService.getRecipeById(req.params.dishId, req.params.recipeId);
    res.status(200).json({ status: "success", data: recipe });
  } catch (error) {
    res.status(error.status || 400).json({ status: "fail", message: error.message });
  }
};

exports.updateRecipeById = async (req, res) => {
  try {
    const updatedRecipe = await recipeService.updateRecipeById(req.params.recipeId, req.body);
    res.status(200).json({ status: "success", data: updatedRecipe });
  } catch (error) {
    res.status(error.status || 400).json({ status: "fail", message: error.message });
  }
};

exports.deleteRecipeById = async (req, res) => {
  try {
    await recipeService.deleteRecipeById(req.params.recipeId);
    res.status(200).json({ status: "success", message: "Công thức đã được xóa" });
  } catch (error) {
    res.status(error.status || 400).json({ status: "fail", message: error.message });
  }
};

exports.getRecipeByDishId = async (req, res) => {
  try {
    const recipe = await recipeService.getRecipeByDishId(req.params.recipeId);
    res.status(200).json({ status: "success", data: recipe });
  } catch (error) {
    res.status(error.status || 400).json({ status: "fail", message: error.message });
  }
};
