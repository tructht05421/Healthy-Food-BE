const catchAsync = require("../utils/catchAsync");
const MealPlanService = require("../services/mealPlanService");

exports.createMealPlan = catchAsync(async (req, res) => {
  const mealPlan = await MealPlanService.createMealPlan(req.body);
  res.status(201).json({ success: true, data: mealPlan });
});

exports.getAllMealPlanNutritionistCreatedBy = catchAsync(async (req, res) => {
  const { _id } = req.user;
  const { page = 1, limit = 10, sort = "createdAt", order = "desc" } = req.query;
  const result = await MealPlanService.getAllMealPlanNutritionistCreatedBy(_id, {
    page,
    limit,
    sort,
    order,
  });
  res.status(200).json({
    status: "success",
    results: result.totalMealPlans,
    page,
    totalPages: result.totalPages,
    data: result.data,
  });
});

exports.getAllNutritionistsWithMealPlans = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, sort = "username", order = "asc", month, year } = req.query;
  const result = await MealPlanService.getAllNutritionistsWithMealPlans({
    page,
    limit,
    sort,
    order,
    month,
    year,
  });
  res.status(200).json({
    status: "success",
    results: result.totalNutritionists,
    page,
    totalPages: result.totalPages,
    data: result.data,
  });
});

exports.getAllMealPlanAdmin = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, sort = "createdAt", order = "desc" } = req.query;
  const result = await MealPlanService.getAllMealPlanAdmin({ page, limit, sort, order });
  res.status(200).json({
    status: "success",
    results: result.totalMealPlans,
    page,
    totalPages: result.totalPages,
    data: result.data,
  });
});

exports.getMealPlanById = catchAsync(async (req, res) => {
  const { _id, role } = req.user;
  const { mealPlanId } = req.params;
  const mealPlan = await MealPlanService.getMealPlanById(mealPlanId, _id, role);
  res.status(200).json({ success: true, data: mealPlan });
});

exports.getUserMealPlan = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const mealPlan = await MealPlanService.getUserMealPlan(userId);
  res.status(200).json({ success: true, data: mealPlan });
});

exports.getMealDayByMealPlan = catchAsync(async (req, res) => {
  const { mealPlanId } = req.params;
  const mealDays = await MealPlanService.getMealDayByMealPlan(mealPlanId);
  res.status(200).json({ success: true, data: mealDays });
});

exports.getUnpaidMealPlanForUser = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const mealPlans = await MealPlanService.getUnpaidMealPlanForUser(userId);
  res.status(200).json({ status: "success", data: mealPlans });
});

exports.getMealPlanDetails = catchAsync(async (req, res) => {
  const { mealPlanId } = req.params;
  const details = await MealPlanService.getMealPlanDetails(mealPlanId);
  res.status(200).json({ status: "success", data: details });
});

exports.updateMealPlan = catchAsync(async (req, res) => {
  const { mealPlanId } = req.params;
  const { _id: userId, role } = req.user;
  const updatedMealPlan = await MealPlanService.updateMealPlan(mealPlanId, req.body, userId, role);
  res.status(200).json({ success: true, data: updatedMealPlan });
});

exports.deleteMealPlan = catchAsync(async (req, res) => {
  const { mealPlanId } = req.params;
  const { _id: userId } = req.user;
  await MealPlanService.deleteMealPlan(mealPlanId, userId);
  res.status(200).json({
    success: true,
    message: "MealPlan và tất cả dữ liệu liên quan đã được xóa thành công",
    data: { _id: mealPlanId },
  });
});

exports.toggleMealPlanStatus = catchAsync(async (req, res) => {
  const { mealPlanId } = req.params;
  const { isPause } = req.body;
  const { _id: userId } = req.user;
  const result = await MealPlanService.toggleMealPlanStatus(mealPlanId, isPause, userId);
  res.status(200).json({
    success: true,
    message: `MealPlan has been ${isPause ? "paused" : "resumed"} successfully`,
    data: result,
  });
});

exports.getMealPlanReminders = catchAsync(async (req, res) => {
  const { mealPlanId } = req.params;
  const { _id: userId } = req.user;
  const data = await MealPlanService.getMealPlanReminders(mealPlanId, userId);
  res.status(200).json({ success: true, data });
});

// CRUD Meal operations
exports.addMealToDay = catchAsync(async (req, res) => {
  const { mealPlanId, mealDayId } = req.params;
  const { mealTime, mealName, dishes } = req.body;
  const { id: userId, role } = req.user;
  const newMeal = await MealPlanService.addMealToDay(
    mealPlanId,
    mealDayId,
    { mealTime, mealName, dishes },
    userId,
    role
  );
  res.status(201).json({ success: true, data: newMeal });
});

exports.removeMealFromDay = catchAsync(async (req, res) => {
  const { mealPlanId, mealDayId, mealId } = req.params;
  const { id: userId, role } = req.user;
  const result = await MealPlanService.removeMealFromDay(
    mealPlanId,
    mealDayId,
    mealId,
    userId,
    role
  );
  res.status(200).json({ success: true, message: "Meal has been deleted", data: result });
});

exports.getMealsByDayId = catchAsync(async (req, res) => {
  const { mealPlanId, mealDayId } = req.params;
  const { id: userId } = req.user;
  const meals = await MealPlanService.getMealsByDayId(mealPlanId, mealDayId, userId);
  res.status(200).json({ success: true, data: meals });
});

exports.getMealById = catchAsync(async (req, res) => {
  const { mealPlanId, mealDayId, mealId } = req.params;
  const { id: userId } = req.user;
  const meal = await MealPlanService.getMealById(mealPlanId, mealDayId, mealId, userId);
  res.status(200).json({ success: true, data: meal });
});

exports.updateMealInDay = catchAsync(async (req, res) => {
  const { mealPlanId, mealDayId, mealId } = req.params;
  const { userId, mealTime, mealName } = req.body;
  const updatedMeal = await MealPlanService.updateMealInDay(mealPlanId, mealDayId, mealId, {
    userId,
    mealTime,
    mealName,
  });
  res.status(200).json({ success: true, message: "Cập nhật bữa ăn thành công", data: updatedMeal });
});

exports.deleteMealInDay = catchAsync(async (req, res) => {
  const { mealPlanId, mealDayId, mealId } = req.params;
  const { userId } = req.body;
  await MealPlanService.deleteMealInDay(mealPlanId, mealDayId, mealId, userId);
  res.status(200).json({ success: true, message: "Xóa bữa ăn thành công" });
});

// CRUD Dish operations
exports.getDishesByMeal = catchAsync(async (req, res) => {
  const { mealPlanId, mealDayId, mealId } = req.params;
  const { id: userId } = req.user;
  const dishes = await MealPlanService.getDishesByMeal(mealPlanId, mealDayId, mealId, userId);
  res.status(200).json({ success: true, data: dishes });
});

exports.addDishesToMeal = catchAsync(async (req, res) => {
  const { mealPlanId, mealDayId, mealId } = req.params;
  const { dishes } = req.body;
  const { id: userId, role } = req.user;
  const result = await MealPlanService.addDishesToMeal(
    mealPlanId,
    mealDayId,
    mealId,
    dishes,
    userId,
    role
  );
  res.status(200).json({ success: true, data: result });
});

exports.deleteDishFromMeal = catchAsync(async (req, res) => {
  const { mealPlanId, mealDayId, mealId, dishId } = req.params;
  const { id: userId, role } = req.user;
  const result = await MealPlanService.deleteDishFromMeal(
    mealPlanId,
    mealDayId,
    mealId,
    dishId,
    userId,
    role
  );
  res.status(200).json({ success: true, data: result });
});

// Additional operations
exports.getAllMealPlanPayment = catchAsync(async (req, res) => {
  const { _id: userId, role } = req.user;
  const { page = 1, limit = 10 } = req.query;
  const result = await MealPlanService.getAllMealPlanPayment(userId, role, { page, limit });
  res.status(200).json({
    success: true,
    results: result.totalMealPlans,
    page,
    totalPages: result.totalPages,
    data: result.data,
  });
});

exports.getMealPlanHistory = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const history = await MealPlanService.getMealPlanHistory(userId);
  res.status(200).json({ success: true, data: history });
});

exports.cleanupRedundantJobs = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const result = await MealPlanService.cleanupRedundantJobs(userId);
  res.status(200).json({
    success: true,
    message: `Đã dọn dẹp ${result.redundantJobsCount} job dư thừa`,
    data: result,
  });
});

module.exports = exports;
