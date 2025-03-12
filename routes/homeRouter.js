const express = require("express");
const router = express.Router();
const homeController = require("../controllers/homeController");

router.get("/ingredients/type", homeController.getIngredientsGroupedByType);

// ✅ Route lấy ingredient theo ID
router.get("/ingredients/type/:type", homeController.getIngredientsByType);

// ✅ Route lấy dish theo ID
router.get("/dishes/type/:type", homeController.getDishByType);

// ✅ Route lấy type cua dish
router.get("/dishes/type", homeController.getDishGroupedByType);

module.exports = router;
