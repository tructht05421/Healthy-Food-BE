/**
 * 📌 Job dọn dẹp payment pending
 * File: cleanupPaymentJobs.js
 */
const Payment = require("../models/Payment");

/**
 * Định nghĩa job dọn dẹp payment pending
 * @param {Agenda} agenda - Đối tượng Agenda để định nghĩa job
 */
const defineCleanupPaymentJob = (agenda) => {
  // Job dọn dẹp payment pending cũ
  agenda.define("cleanup pending payments", { priority: "high" }, async (job) => {
    try {
      console.log("🧹 Bắt đầu dọn dẹp payment pending cũ...");

      const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 ngày trước

      const result = await Payment.deleteMany({
        status: "pending",
        createdAt: { $lt: cutoffDate },
      });

      console.log(`✅ Đã xóa ${result.deletedCount} payment pending cũ`);

      // Lưu kết quả vào job data nếu cần
      job.attrs.data.lastRun = new Date();
      job.attrs.data.deletedCount = result.deletedCount;
      await job.save();
    } catch (error) {
      console.error("❌ Lỗi khi xóa payment pending cũ:", error);
      throw error; // Để Agenda có thể xử lý lỗi và thử lại nếu cần
    }
  });
};

/**
 * Lên lịch job dọn dẹp payment pending
 * @param {Agenda} agenda - Đối tượng Agenda để lên lịch job
 */
const scheduleCleanupPaymentJob = (agenda) => {
  // Chạy job hàng ngày lúc 1 giờ sáng
  agenda.every("0 1 * * *", "cleanup pending payments", {}, { timezone: "Asia/Ho_Chi_Minh" });

  // Hoặc chạy mỗi 24 giờ nếu không cần cụ thể giờ
  // agenda.every("24 hours", "cleanup pending payments");

  console.log("📅 Đã lên lịch job dọn dẹp payment pending");
};

module.exports = {
  defineCleanupPaymentJob,
  scheduleCleanupPaymentJob,
};
