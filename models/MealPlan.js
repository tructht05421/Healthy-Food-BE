const mongoose = require("mongoose");

const userMealPlanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  mealPlanId: { type: mongoose.Schema.Types.ObjectId, ref: "MealPlan", required: true },
  startDate: { type: Date, default: Date.now }, // Ngày bắt đầu MealPlan
});
// 📌 Schema cho MealTracking (theo dõi bữa ăn)
const mealTrackingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Ai theo dõi bữa ăn
  mealPlanId: { type: mongoose.Schema.Types.ObjectId, ref: "MealPlan", required: true }, // Liên kết MealPlan
  mealDayId: { type: mongoose.Schema.Types.ObjectId, ref: "MealDay", required: true }, // Liên kết ngày ăn
  mealId: { type: mongoose.Schema.Types.ObjectId, ref: "Meal", required: true }, // Liên kết bữa ăn

  isDone: { type: Boolean, default: false }, // Đánh dấu đã hoàn thành hay chưa
  caloriesConsumed: { type: Number, default: 0 }, // Lượng calo đã ăn
  updatedAt: { type: Date, default: Date.now }, // Lưu thời gian cập nhật gần nhất
});

// 📌 Schema cho mỗi bữa ăn
const mealSchema = new mongoose.Schema({
  mealDayId: { type: mongoose.Schema.Types.ObjectId, ref: "MealDay", required: true },
  mealTime: String, // "07:00"
  mealName: String, // "Breakfast", "Lunch", "Dinner"
  dishes: [
    {
      dishId: mongoose.Schema.Types.ObjectId,
      name: String,
      calories: Number,
    },
  ],
});

// 📌 Schema cho mỗi ngày trong MealPlan
const mealDaySchema = new mongoose.Schema({
  mealPlanId: { type: mongoose.Schema.Types.ObjectId, ref: "MealPlan", required: true },
  date: String, // YYYY-MM-DD
});

// 📌 Schema chính cho MealPlan
const mealPlanSchema = new mongoose.Schema(
  {
    title: String,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: "Payment", default: null },
    type: { type: String, enum: ["fixed", "custom"], required: true },
    duration: Number,
    startDate: Date,
    endDate: Date,
    price: Number,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isBlock: { type: Boolean, default: false },
    isPause: { type: Boolean, default: false },
    isDelete: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// 📌 Xuất các model trong cùng file
const UserMealPlan = mongoose.model("UserMealPlan", userMealPlanSchema);
const MealPlan = mongoose.model("MealPlan", mealPlanSchema);
const MealDay = mongoose.model("MealDay", mealDaySchema);
const Meal = mongoose.model("Meal", mealSchema);
const MealTracking = mongoose.model("MealTracking", mealTrackingSchema);

module.exports = { UserMealPlan, MealPlan, MealDay, Meal, MealTracking };
