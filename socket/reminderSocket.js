const jwt = require("jsonwebtoken");

function initializeReminderSocket(io) {
  // Middleware xác thực JWT
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) throw new Error("❌ Authentication error: No token provided");

      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      console.error("❌ Lỗi xác thực:", err.message);
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    console.log("🟢 Reminder socket connected:", socket.userId);

    // Tự động thêm user vào room của chính họ
    if (socket.userId) {
      socket.join(socket.userId);
      console.log(`👤 User ${socket.userId} tự động được thêm vào room`);
    }

    // Xử lý sự kiện join - sử dụng để client có thể join vào room
    socket.on("join", (userId) => {
      if (!userId) {
        console.error("❌ Thiếu userId trong join event");
        return;
      }

      console.log(`🔔 User ${userId} joined reminder socket`);
      socket.join(userId);
    });

    // Không cần sự kiện set_reminder vì reminders đã được tạo từ lúc tạo MealPlan
    // và sẽ được gửi bởi Agenda job khi đến thời gian

    socket.on("disconnect", () => {
      console.log("🔴 Reminder socket disconnected:", socket.userId);
    });
  });
}

module.exports = initializeReminderSocket;
