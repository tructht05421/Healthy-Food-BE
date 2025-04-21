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

    // Xử lý sự kiện join - sử dụng để client có thể join vào room
    socket.on("join", (userId) => {
      if (!userId) {
        console.error("❌ Thiếu userId trong join event");
        return;
      }

      // Rời tất cả các phòng hiện tại để tránh nhầm lẫn
      Object.keys(socket.rooms).forEach((room) => {
        if (room !== socket.id) {
          socket.leave(room);
        }
      });

      socket.join(userId);
      console.log(`🔔 User ${userId} joined reminder socket`);
    });

    socket.on("disconnect", () => {
      console.log("🔴 Reminder socket disconnected:", socket.userId);
    });
  });
}

module.exports = initializeReminderSocket;
