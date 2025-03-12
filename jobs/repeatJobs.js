/**
 * 📌 Job lặp lại mỗi 3 giây
 */

// 🛠 Định nghĩa job lặp lại
exports.defineRepeatingJob = (agenda) => {
  agenda.define("repeatingJob", async (job) => {
    const currentTime = new Date().toLocaleTimeString();
    console.log(`[${currentTime}] Đang thực hiện công việc lặp lại mỗi 3 giây`);
  });
};

// ⏳ Hàm lên lịch job lặp lại
exports.scheduleRepeatingJob = (agenda) => {
  if (!agenda) {
    console.error("❌ Lỗi: agenda chưa được khởi tạo!");
    return;
  }
  agenda.every("3 seconds", "repeatingJob");
  console.log("✅ Đã lên lịch cho job lặp lại mỗi 3 giây");
};
