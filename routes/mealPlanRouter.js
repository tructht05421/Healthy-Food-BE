const express = require("express");
const mealPlanRouter = express.Router();
const {
  createMealPlan,
  addMealToDay,
  addDishesToMeal,
  deleteDishFromMeal,
  getMealPlanById,
  getMealDayByMealPlan,
  getMealById,
  getMealsByDayId,
  getDishesByMeal,
  updateMealPlan,
  toggleMealPlanStatus,
  deleteMealPlan,
  getUserMealPlan,
  removeMealFromDay,
  getUnpaidMealPlanForUser,
  getMealPlanDetails,
  getAllMealPlanPayment,
  getMealPlanHistory,
  getAllMealPlanNutritionistCreatedBy,
  getAllMealPlanAdmin,
  getAllNutritionistsWithMealPlans,
} = require("../controllers/mealPlanController");
const { isAuthenticated, isAdmin, isNutritionist } = require("../middlewares/isAuthenticated");

// Áp dụng middleware cho toàn bộ router
mealPlanRouter.use(isAuthenticated);

// 📌 MealPlan aggregations (Đặt các route tĩnh trước)
mealPlanRouter.get("/nutritionist/created", isNutritionist, getAllMealPlanNutritionistCreatedBy);
mealPlanRouter.get("/nutritionists", isAdmin, getAllNutritionistsWithMealPlans);
mealPlanRouter.get("/admin", isAdmin, getAllMealPlanAdmin);
mealPlanRouter.get("/payments", getAllMealPlanPayment);

// 📌 User-specific MealPlan routes
mealPlanRouter.get("/users/:userId", getUserMealPlan);
mealPlanRouter.get("/users/:userId/unpaid", getUnpaidMealPlanForUser);
mealPlanRouter.get("/users/:userId/history", getMealPlanHistory);

// 📌 MealPlan routes (Đặt route động sau)
mealPlanRouter.route("/").post(createMealPlan);

mealPlanRouter
  .route("/:mealPlanId")
  .get(getMealPlanById)
  .put(updateMealPlan)
  .delete(deleteMealPlan);

mealPlanRouter.patch("/:mealPlanId/toggle", toggleMealPlanStatus);
mealPlanRouter.get("/:mealPlanId/details", getMealPlanDetails);

// 📌 MealDay routes
mealPlanRouter.get("/:mealPlanId/mealdays", getMealDayByMealPlan);

// 📌 Meal routes
mealPlanRouter
  .route("/:mealPlanId/mealdays/:mealDayId/meals")
  .get(getMealsByDayId)
  .post(addMealToDay);

mealPlanRouter
  .route("/:mealPlanId/mealdays/:mealDayId/meals/:mealId")
  .get(getMealById)
  .delete(removeMealFromDay);

// 📌 Dish routes
mealPlanRouter
  .route("/:mealPlanId/mealdays/:mealDayId/meals/:mealId/dishes")
  .get(getDishesByMeal)
  .post(addDishesToMeal);

mealPlanRouter.delete(
  "/:mealPlanId/mealdays/:mealDayId/meals/:mealId/dishes/:dishId",
  deleteDishFromMeal
);

module.exports = mealPlanRouter;
