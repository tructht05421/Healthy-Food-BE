const jwt = require("jsonwebtoken");
const User = require("../models/UserModel");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

function initializeChatSocket(io) {
  console.log("chatSocket received io:", io ? "Yes" : "No");

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) throw new Error("Authentication error: No token provided");

      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      socket.userId = decoded.id;
      console.log("✅ SOCKET.USERID:", socket.userId);
      next();
    } catch (err) {
      console.error("❌ Authentication error:", err.message);
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    console.log("🟢 User connected:", socket.userId);

    socket.on("join", ({ userId }) => {
      socket.join(userId);
      console.log(`User ${userId} joined their own room`);
    });

    socket.on("join_room", ({ conversationId, userId }) => {
      socket.join(conversationId);
      console.log(`User ${userId} joined room: ${conversationId}`);
    });

    socket.on("send_message", async (messageData) => {
      try {
        const { conversationId, senderId, text, type, imageUrl, videoUrl } = messageData;
        const message = await Message.create({
          conversationId,
          senderId,
          text,
          type: type || "text",
          imageUrl,
          videoUrl,
        });

        const conversation = await Conversation.findByIdAndUpdate(
          conversationId,
          {
            $push: { messages: message._id },
            $set: {
              lastMessage: text || imageUrl || videoUrl || "New message",
              updatedAt: Date.now(),
            },
          },
          { new: true }
        );

        io.to(conversationId).emit("receive_message", message);
      } catch (error) {
        console.error("Error sending message via socket:", error);
        socket.emit("error", { message: error.message });
      }
    });

    socket.on("typing", (conversationId) => {
      socket.to(conversationId).emit("typing_status", { userId: socket.userId, typing: true });
    });

    socket.on("stop_typing", (conversationId) => {
      socket.to(conversationId).emit("typing_status", { userId: socket.userId, typing: false });
    });

    socket.on("accept_conversation", async (conversationId) => {
      try {
        const conversation = await Conversation.findByIdAndUpdate(
          conversationId,
          { status: "active" },
          { new: true }
        );
        io.to(conversationId).emit("conversationUpdated", conversation);
      } catch (error) {
        console.error("Error accepting conversation:", error);
        socket.emit("error", { message: error.message });
      }
    });

    socket.on("check_conversation", async (conversationId) => {
      try {
        const conversation = await Conversation.findByIdAndUpdate(
          conversationId,
          { status: "checked" },
          { new: true }
        );
        io.to(conversationId).emit("conversationUpdated", conversation);
      } catch (error) {
        console.error("Error checking conversation:", error);
        socket.emit("error", { message: error.message });
      }
    });

    socket.on("disconnect", () => {
      console.log("🔴 User disconnected:", socket.userId);
    });
  });
}

module.exports = initializeChatSocket;
