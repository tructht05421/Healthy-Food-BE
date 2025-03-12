const moment = require("moment-timezone");
const { agenda } = require("../config/agenda"); // Giả sử bạn đã cấu hình Agenda ở đây
const Reminder = require("../models/Reminder"); // Model của Reminder

// 📌 Hàm tạo Job mới
exports.createJob = async (req, res) => {
  try {
    const { userId, mealPlanId, mealName, mealTime, dishes, remindDate } = req.body;

    // ✅ Kiểm tra dữ liệu đầu vào
    if (!userId || !mealPlanId || !mealName || !mealTime || !remindDate || !dishes.length) {
      return res.status(400).json({ error: "Thiếu dữ liệu cần thiết để tạo Job." });
    }

    // 📌 Chuyển remindTime sang UTC để thống nhất múi giờ
    const remindTime = moment
      .tz(`${remindDate} ${mealTime}`, "YYYY-MM-DD HH:mm", "Asia/Ho_Chi_Minh")
      .utc()
      .toDate();

    // 📝 Tạo nội dung message từ danh sách món ăn
    const message = `📢 Đến giờ ăn ${mealName}, bạn có món: ${dishes.join(", ")}`;

    // 🔎 Kiểm tra xem Reminder đã tồn tại chưa
    let existingReminder = await Reminder.findOne({ userId, mealPlanId, remindTime });

    if (existingReminder) {
      console.log(`⚠️ Reminder đã tồn tại: ${remindTime.toISOString()}`);
      return res.status(200).json({ message: "Reminder đã tồn tại.", reminder: existingReminder });
    }

    // 🆕 Tạo mới Reminder
    existingReminder = await Reminder.create({ userId, mealPlanId, message, remindTime });

    console.log(`📆 Lên lịch nhắc nhở vào: ${remindTime.toISOString()}`);

    // ⏳ Tạo Job trong Agenda
    const job = await agenda.schedule(remindTime, "sendReminder", {
      reminderId: existingReminder._id,
      userId,
      message,
    });

    // 🔗 Lưu jobId vào Reminder
    existingReminder.jobId = job.attrs._id;
    await existingReminder.save();

    return res.status(201).json({
      message: "Job đã được tạo thành công!",
      reminder: existingReminder,
    });
  } catch (error) {
    console.error("🔥 Lỗi khi tạo Job:", error);
    return res.status(500).json({ error: "Đã xảy ra lỗi khi tạo Job." });
  }
};
