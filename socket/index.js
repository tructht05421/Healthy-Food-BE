const socketIO = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("../models/UserModel");
const Conversation = require("../models/ConversationModel");
const Message = require("../models/MessageModel");

function initializeSocket(server) {
  const io = socketIO(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
      credentials: true,
    },
  });

  // Auth middleware: Xác thực người dùng qua JWT
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) throw new Error("Authentication error");

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id; // Thêm userId vào socket để có thể dùng trong các sự kiện
      next();
    } catch (err) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.userId);

    // Khi người dùng tham gia vào phòng chat (join)
    socket.on("join", async (userId) => {
      try {
        // Cập nhật trạng thái online cho người dùng
        await User.findByIdAndUpdate(userId, { isOnline: true });
        io.emit("user_status", { userId, isOnline: true });
      } catch (err) {
        console.error("Error updating user status:", err);
      }
    });

    // Lắng nghe sự kiện gửi tin nhắn
    socket.on("send_message", async (messageData) => {
      try {
        const { conversationId, senderId, receiverId, text, imageUrl, videoUrl } = messageData;

        // Tạo tin nhắn mới
        const newMessage = new Message({
          conversationId,
          senderId,
          text,
          imageUrl,
          videoUrl,
        });
        await newMessage.save();

        // Cập nhật conversation với tin nhắn mới
        const conversation = await Conversation.findById(conversationId);
        conversation.messages.push(newMessage._id);
        conversation.lastMessage = text;
        await conversation.save();

        // Gửi tin nhắn cho người nhận (nutritionist hoặc user)
        io.to(receiverId).emit("receive_message", newMessage);
      } catch (err) {
        console.error("Error sending message:", err);
      }
    });

    // Lắng nghe sự kiện người dùng đang gõ (typing)
    socket.on("typing", (conversationId) => {
      socket.broadcast.emit("typing_status", {
        conversationId,
        isTyping: true,
        userId: socket.userId,
      });
    });

    // Lắng nghe sự kiện ngừng gõ (stop typing)
    socket.on("stop_typing", (conversationId) => {
      socket.broadcast.emit("typing_status", {
        conversationId,
        isTyping: false,
        userId: socket.userId,
      });
    });

    // Khi nutritionist nhận cuộc trò chuyện (chuyển trạng thái)
    socket.on("accept_conversation", async (conversationId) => {
      try {
        const conversation = await Conversation.findById(conversationId);
        conversation.nutritionistId = socket.userId;
        conversation.status = "active"; // Đổi trạng thái thành active
        await conversation.save();

        // Gửi thông báo cho cả user và nutritionist về việc nhận cuộc trò chuyện
        io.to(conversation.userId).emit("conversation_status", {
          conversationId,
          status: "active",
        });
        io.to(socket.userId).emit("conversation_status", { conversationId, status: "active" });
      } catch (err) {
        console.error("Error accepting conversation:", err);
      }
    });

    // Khi nutritionist chuyển trạng thái sang checked (tạm thời không tư vấn)
    socket.on("check_conversation", async (conversationId) => {
      try {
        const conversation = await Conversation.findById(conversationId);
        conversation.status = "checked"; // Chuyển trạng thái thành checked
        await conversation.save();

        // Gửi thông báo cho user và nutritionist
        io.to(conversation.userId).emit("conversation_status", {
          conversationId,
          status: "checked",
        });
        io.to(socket.userId).emit("conversation_status", { conversationId, status: "checked" });
      } catch (err) {
        console.error("Error checking conversation:", err);
      }
    });

    // Xử lý ngắt kết nối
    socket.on("disconnect", async () => {
      try {
        // Cập nhật trạng thái offline cho người dùng
        await User.findByIdAndUpdate(socket.userId, {
          isOnline: false,
          lastActive: new Date(),
        });
        io.emit("user_status", { userId: socket.userId, isOnline: false });
        console.log("User disconnected:", socket.userId);
      } catch (err) {
        console.error("Error updating user status on disconnect:", err);
      }
    });
  });

  return io;
}

module.exports = initializeSocket;
