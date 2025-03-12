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

      // Cập nhật trạng thái của reminder
      reminder.status = "sent";
      reminder.sentAt = new Date();
      await reminder.save();

      // Sử dụng message từ reminder trong database thay vì từ job data
      const reminderMessage = reminder.message || message;

      console.log(`🔔 [Nhắc nhở] User ${userId}: ${reminderMessage}`);

      // Gửi thông báo đến client thông qua socket
      io.to(userId.toString()).emit("receive_reminder", {
        id: reminder._id,
        message: reminderMessage,
        timestamp: new Date(),
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
    if (!agenda._collection) {
      console.log("⏳ Agenda chưa sẵn sàng, đang chờ...");
      await new Promise((resolve) => setTimeout(resolve, 3000)); // Chờ 3 giây
    }

    // Kiểm tra nếu reminderId hoặc userId là null / undefined
    if (!reminderId || !userId) {
      throw new Error("❌ reminderId hoặc userId không hợp lệ!");
    }

    const scheduledTime = remindTime || "in 5 minutes";
    const jobData = {
      reminderId: reminderId.toString(), // Chuyển ObjectId thành string
      userId: userId.toString(), // Chuyển ObjectId thành string
      message,
    };

    const job = await agenda.schedule(scheduledTime, "sendReminder", jobData);
    console.log(`✅ Đã lên lịch job send reminder vào ${scheduledTime} cho User ${userId}`);

    return job;
  } catch (error) {
    console.error("❌ Lỗi khi lên lịch send reminder:", error);
    throw error;
  }
};
