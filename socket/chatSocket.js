const jwt = require("jsonwebtoken");
const User = require("../models/UserModel");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

function initializeChatSocket(io) {
  // Middleware xác thực socket với JWT
  io.use(async (socket, next) => {
    try {
      console.log("TOKEN CLIENT", socket.handshake.auth.token);
      const token = socket.handshake.auth.token;
      if (!token) throw new Error("Authentication error");

      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      console.log("dEcode", decoded);

      socket.userId = decoded.id; // Thêm userId vào socket
      console.log("✅ SOCKET.USERID:", socket.userId);

      next();
    } catch (err) {
      console.error("❌ Authentication loiõ:", err.message);
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    console.log("🟢 User connected:", socket.userId);

    socket.on("join", async (userId) => {
      try {
        await User.findByIdAndUpdate(userId, { isOnline: true });
        io.emit("user_status", { userId, isOnline: true });
      } catch (err) {
        console.error("❌ Error updating user status:", err);
      }
    });

    socket.on("send_message", async (messageData) => {
      try {
        const { conversationId, senderId, receiverId, text, imageUrl, videoUrl } = messageData;

        const newMessage = new Message({
          conversationId,
          senderId,
          text,
          imageUrl,
          videoUrl,
        });
        await newMessage.save();

        const conversation = await Conversation.findById(conversationId);
        conversation.messages.push(newMessage._id);
        conversation.lastMessage = text;
        await conversation.save();

        io.to(receiverId).emit("receive_message", newMessage);
      } catch (err) {
        console.error("❌ Error sending message:", err);
      }
    });

    socket.on("typing", (conversationId) => {
      socket.broadcast.emit("typing_status", {
        conversationId,
        isTyping: true,
        userId: socket.userId,
      });
    });

    socket.on("stop_typing", (conversationId) => {
      socket.broadcast.emit("typing_status", {
        conversationId,
        isTyping: false,
        userId: socket.userId,
      });
    });

    socket.on("accept_conversation", async (conversationId) => {
      try {
        const conversation = await Conversation.findById(conversationId);
        conversation.nutritionistId = socket.userId;
        conversation.status = "active";
        await conversation.save();

        io.to(conversation.userId).emit("conversation_status", {
          conversationId,
          status: "active",
        });
        io.to(socket.userId).emit("conversation_status", { conversationId, status: "active" });
      } catch (err) {
        console.error("❌ Error accepting conversation:", err);
      }
    });

    socket.on("check_conversation", async (conversationId) => {
      try {
        const conversation = await Conversation.findById(conversationId);
        conversation.status = "checked";
        await conversation.save();

        io.to(conversation.userId).emit("conversation_status", {
          conversationId,
          status: "checked",
        });
        io.to(socket.userId).emit("conversation_status", { conversationId, status: "checked" });
      } catch (err) {
        console.error("❌ Error checking conversation:", err);
      }
    });

    socket.on("disconnect", async () => {
      try {
        await User.findByIdAndUpdate(socket.userId, {
          isOnline: false,
          lastActive: new Date(),
        });
        io.emit("user_status", { userId: socket.userId, isOnline: false });
        console.log("🔴 User disconnected:", socket.userId);
      } catch (err) {
        console.error("❌ Error updating user status on disconnect:", err);
      }
    });
  });
}

module.exports = initializeChatSocket;
