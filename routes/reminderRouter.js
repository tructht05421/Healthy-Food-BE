const express = require("express");
const reminderRouter = express.Router();
const {
  getAllReminders,
  getReminderById,
  updateReminder,
  deleteReminder,
  setFakeTime,
  resetTime,
  createRemindersForMealPlan,
} = require("../controllers/reminderController");

// Fake Time API
reminderRouter.post("/fake-time", setFakeTime);
//reminderRouter.post("/reset-time", resetTime);

// Reminder CRUD API
reminderRouter.post("/", createRemindersForMealPlan); // Tạo Reminder mới
reminderRouter.get("/", getAllReminders); // Lấy tất cả Reminder
reminderRouter.get("/:reminderId", getReminderById); // Lấy Reminder theo ID
reminderRouter.put("/:reminderId", updateReminder); // Cập nhật Reminder
reminderRouter.delete("/:reminderId", deleteReminder); // Xóa Reminder (isDelete: true)

module.exports = reminderRouter;
