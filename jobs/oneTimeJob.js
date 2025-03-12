/**
 * 📌 Job chạy một lần duy nhất
 */
exports.defineOneTimeJob = (agenda) => {
  agenda.define("oneTimeJob", async (job) => {
    const currentTime = new Date().toLocaleTimeString();
    console.log(`🚀 [${currentTime}] One-time job bắt đầu chạy...`);
    console.log("🔍 Dữ liệu kèm theo:", job.attrs.data);
  });
};

// 🕒 Hàm lên lịch job chạy một lần
exports.scheduleOneTimeJob = async (agenda, when, data) => {
  // ✅ Truyền agenda vào
  try {
    if (!agenda || !agenda._collection) {
      // ✅ Kiểm tra agenda hợp lệ
      console.log("⏳ Agenda chưa sẵn sàng, đang chờ...");
      await new Promise((resolve) => setTimeout(resolve, 3000)); // Chờ 3 giây
    }

    const scheduledTime = when || "in 5 seconds";
    const jobData = data || {
      message: "🚀 Công việc chạy một lần",
      createdAt: new Date(),
    };

    const job = await agenda.schedule(scheduledTime, "oneTimeJob", jobData);
    console.log(`✅ Đã lên lịch job oneTimeJob vào ${scheduledTime}`);
    return job;
  } catch (error) {
    console.error("❌ Lỗi khi lên lịch oneTimeJob:", error);
  }
};
