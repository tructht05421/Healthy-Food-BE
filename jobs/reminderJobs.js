const Reminder = require("../models/Reminder");

/**
 * 📌 Định nghĩa job gửi nhắc nhở
 */
exports.defineReminderJob = (agenda, io) => {
  agenda.define("sendReminder", async (job) => {
    try {
      const { reminderId, userId, message } = job.attrs.data;

      if (!reminderId || !userId) {
        console.error("❌ Thiếu thông tin reminderId hoặc userId!");
        return;
      }

      // Tìm reminder từ database
      const reminder = await Reminder.findById(reminderId);

      if (!reminder) {
        console.log(`❌ Không tìm thấy Reminder ID: ${reminderId}`);
        return;
      }

      // Kiểm tra xem reminder có còn active không
      if (!reminder.isActive) {
        console.log(`❌ Reminder ID: ${reminderId} đã bị hủy, không gửi thông báo`);
        return;
      }

      // Cập nhật trạng thái của reminder
      reminder.status = "sent";
      reminder.sentAt = new Date();
      await reminder.save();

      // Sử dụng message từ reminder trong database thay vì từ job data
      const reminderMessage = reminder.message || message;

      console.log(`🔔 [Nhắc nhở] User ${userId}: ${reminderMessage}`);

      // Gửi thông báo đến client thông qua socket
      io.to(userId.toString()).emit("mealReminder", {
        id: reminder._id,
        userId: userId.toString(), // Thêm userId vào payload
        mealPlanId: reminder.mealPlanId,
        mealDayId: reminder.mealDayId,
        mealId: reminder.mealId,
        message: reminderMessage,
        timestamp: reminder.sentAt,
      });
    } catch (error) {
      console.error("❌ Lỗi trong job send reminder:", error);
    }
  });
};

/**
 * 🕒 Hàm lên lịch gửi nhắc nhở
 */
exports.scheduleReminderJob = async (agenda, remindTime, reminderId, userId, message = "") => {
  try {
    if (!reminderId || !userId) {
      throw new Error("❌ reminderId hoặc userId không hợp lệ!");
    }

    const reminder = await Reminder.findById(reminderId);
    if (!reminder) {
      throw new Error(`❌ Không tìm thấy Reminder ID: ${reminderId}`);
    }
    if (!reminder.isActive) {
      throw new Error(`❌ Reminder ID: ${reminderId} đã bị hủy, không lên lịch`);
    }

    const scheduledTime = remindTime || "in 5 minutes";
    const jobData = {
      reminderId: reminderId.toString(),
      userId: userId.toString(),
      message,
    };

    let job;
    const now = new Date();
    if (scheduledTime < now) {
      // Nếu thời gian đã qua, chạy ngay lập tức
      console.log(`⏰ Thời gian ${scheduledTime} đã qua, chạy job ngay lập tức cho User ${userId}`);
      job = await agenda.now("sendReminder", jobData);
    } else {
      job = await agenda.schedule(scheduledTime, "sendReminder", jobData);
      console.log(`✅ Đã lên lịch job send reminder vào ${scheduledTime} cho User ${userId}`);
    }

    return job;
  } catch (error) {
    console.error("❌ Lỗi khi lên lịch send reminder:", error);
    throw error;
  }
};
