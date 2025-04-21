const ingredientService = require("../services/ingredientService");

exports.createIngredient = async (req, res) => {
  try {
    const newIngredient = await ingredientService.createIngredient(req.body);
    res.status(201).json({ status: "success", data: newIngredient });
  } catch (error) {
    res.status(400).json({ status: "fail", message: error.message });
  }
};

exports.createManyIngredients = async (req, res) => {
  try {
    const ingredients = await ingredientService.createManyIngredients(req.body);
    res.status(201).json({ status: "success", data: ingredients });
  } catch (error) {
    res.status(400).json({ status: "fail", message: error.message });
  }
};

exports.getAllIngredients = async (req, res) => {
  try {
    const result = await ingredientService.getAllIngredients(
      req.query,
      req.cookies.token || req.headers.authorization?.split(" ")[1]
    );
    res.status(200).json({ status: "success", data: result });
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
};

exports.getIngredientById = async (req, res) => {
  try {
    const ingredient = await ingredientService.getIngredientById(req.params.ingredientId);
    res.status(200).json({ status: "success", data: ingredient });
  } catch (error) {
    res.status(error.status || 500).json({ status: "fail", message: error.message });
  }
};

exports.updateIngredient = async (req, res) => {
  try {
    const updatedIngredient = await ingredientService.updateIngredient(
      req.params.ingredientId,
      req.body
    );
    res.status(200).json({ status: "success", data: updatedIngredient });
  } catch (error) {
    res.status(error.status || 400).json({ status: "fail", message: error.message });
  }
};

exports.deleteIngredient = async (req, res) => {
  try {
    const updatedIngredient = await ingredientService.deleteIngredient(req.params.ingredientId);
    res.status(200).json({
      status: "success",
      message: "Ingredient has been soft deleted",
      data: updatedIngredient,
    });
  } catch (error) {
    res.status(error.status || 500).json({ status: "fail", message: error.message });
  }
};

exports.hideIngredient = async (req, res) => {
  try {
    const hiddenIngredient = await ingredientService.hideIngredient(req.params.ingredientId);
    res
      .status(200)
      .json({ status: "success", message: "Ingredient has been hidden", data: hiddenIngredient });
  } catch (error) {
    res.status(error.status || 500).json({ status: "fail", message: error.message });
  }
};

exports.searchIngredientsByName = async (req, res) => {
  try {
    const result = await ingredientService.searchIngredientsByName(req.query);
    res.status(200).json({ status: "success", data: result });
  } catch (error) {
    res.status(error.status || 500).json({ status: "fail", message: error.message });
  }
};

exports.filterIngredientsByType = async (req, res) => {
  try {
    const result = await ingredientService.filterIngredientsByType(req.query);
    res.status(200).json({ status: "success", data: result });
  } catch (error) {
    res.status(error.status || 500).json({ status: "fail", message: error.message });
  }
};
