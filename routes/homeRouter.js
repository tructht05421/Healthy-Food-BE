const express = require("express");
const homeRouter = express.Router();
const homeController = require("../controllers/homeController");

homeRouter.get("/ingredients/type", homeController.getIngredientsGroupedByType);

// ✅ Route lấy ingredient theo ID
homeRouter.get("/ingredients/type/:type", homeController.getIngredientsByType);

// ✅ Route lấy dish theo ID
homeRouter.get("/dishes/type/:type", homeController.getDishByType);

// ✅ Route lấy type cua dish
homeRouter.get("/dishes/type", homeController.getDishGroupedByType);

module.exports = homeRouter;
