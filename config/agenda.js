/**
 * Cấu hình Agenda.js
 */
const Agenda = require("agenda");
require("dotenv").config();

// Lấy URL kết nối từ biến môi trường
const mongoUrl = process.env.MONGODB_URL;

// Tạo instance Agenda và kết nối đến MongoDB
const agenda = new Agenda({
  db: {
    address: mongoUrl,
    collection: "agendaJobs",
  },
  processEvery: "1 second", // Kiểm tra công việc mỗi giây
});

// 🟢 Khi Agenda sẵn sàng
agenda.on("ready", () => {
  console.log("✅ Agenda đã kết nối với MongoDB và sẵn sàng xử lý công việc");
  agenda.start(); // Bắt đầu xử lý công việc
});

// 🛑 Hàm dừng Agenda
const stopAgenda = async () => {
  console.log("🔴 Đang dừng Agenda...");
  await agenda.stop();
};

// Xuất `agenda` để dùng ở nơi khác
module.exports = {
  agenda,
  stopAgenda,
};
