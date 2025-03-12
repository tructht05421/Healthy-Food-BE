const mongoose = require("mongoose");

const ReminderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    mealPlanId: { type: mongoose.Schema.Types.ObjectId, ref: "MealPlan", required: true },
    mealDayId: { type: mongoose.Schema.Types.ObjectId, ref: "MealDay", required: true },
    mealId: { type: mongoose.Schema.Types.ObjectId, ref: "Meal", required: true },

    message: { type: String, required: true },

    remindTime: { type: Date, required: true }, // Lưu dưới dạng UTC

    jobId: { type: String, default: null }, // ID của job trong Agenda

    isActive: { type: Boolean, default: true }, // Nếu false → Job bị tạm dừng

    status: {
      type: String,
      enum: ["scheduled", "paused", "sent", "cancelled"],
      default: "scheduled",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Reminder", ReminderSchema);
