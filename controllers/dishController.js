const jwt = require("jsonwebtoken");
const UserModel = require("../models/UserModel");
const dishService = require("../services/dishService");

exports.createDish = async (req, res) => {
  try {
    const newDish = await dishService.createDish(req.body);
    res.status(201).json({ status: "success", data: newDish });
  } catch (error) {
    res.status(error.status || 400).json({
      status: "fail",
      message: error.message,
    });
  }
};

exports.createManyDishes = async (req, res) => {
  try {
    const dishes = await dishService.createManyDishes(req.body);
    res.status(201).json({ status: "success", data: dishes });
  } catch (error) {
    res.status(400).json({ status: "fail", message: error.message });
  }
};

exports.getAllDishes = async (req, res) => {
  try {
    const result = await dishService.getAllDishes(req.query);
    res.status(200).json({ status: "success", data: result });
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
};
// New controller for searchDishByName
exports.searchDishByName = async (req, res) => {
  try {
    const result = await dishService.searchDishByName(req.query);
    res.status(200).json({ status: "success", data: result });
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
};

exports.getDishByType = async (req, res) => {
  try {
    console.log("Request params:", req.params); // Debug log
    console.log("Request query:", req.query); // Debug log
    const result = await dishService.getDishByType(req.params.type, req.query);
    res.status(200).json({ status: "success", data: result });
  } catch (error) {
    console.error("Error in getDishByType:", error.message); // Debug log
    res.status(500).json({ status: "fail", message: error.message });
  }
};
// getDishesBySeason
exports.getDishesBySeason = async (req, res) => {
  try {
    const validSeasons = ["Spring", "Summer", "Fall", "Winter"];
    const { season } = req.query;

    // Validate season parameter
    if (!season || !validSeasons.includes(season)) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid or missing season. Must be one of: Spring, Summer, Fall, Winter",
      });
    }

    const result = await dishService.getDishesBySeason(req.query);
    res.status(200).json({ status: "success", data: result });
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
};

exports.getAllDishesForNutri = async (req, res) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ status: "fail", message: "Authentication token required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const user = await UserModel.findById(decoded.id);

    if (!user || user.role !== "nutritionist") {
      return res
        .status(403)
        .json({ status: "fail", message: "Access restricted to nutritionists only" });
    }

    const result = await dishService.getAllDishesForNutri(req.query);
    res.status(200).json({ status: "success", data: result });
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
};

exports.getDishById = async (req, res) => {
  try {
    const dish = await dishService.getDishById(req.params.dishId);
    res.status(200).json({ status: "success", data: dish });
  } catch (error) {
    res.status(error.status || 500).json({ status: "fail", message: error.message });
  }
};

exports.getDishByType = async (req, res) => {
  try {
    const result = await dishService.getDishByType(req.params.type, req.query);
    res.status(200).json({ status: "success", data: result });
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
};

exports.updateDish = async (req, res) => {
  try {
    const updatedDish = await dishService.updateDish(req.params.dishId, req.body);
    res.status(200).json({ status: "success", data: updatedDish });
  } catch (error) {
    res.status(error.status || 400).json({ status: "fail", message: error.message });
  }
};

const Dish = require("../models/Dish");

exports.deleteDish = async (req, res) => {
  try {
    const updatedDish = await dishService.deleteDish(req.params.dishId);
    res
      .status(200)
      .json({ status: "success", message: "Dish has been soft deleted", data: updatedDish });
  } catch (error) {
    res.status(error.status || 500).json({ status: "fail", message: error.message });
  }
};

exports.hideDish = async (req, res) => {
  try {
    const hiddenDish = await dishService.hideDish(req.params.dishId);
    res.status(200).json({ status: "success", message: "Dish has been hidden", data: hiddenDish });
  } catch (error) {
    res.status(error.status || 500).json({ status: "fail", message: error.message });
  }
};
