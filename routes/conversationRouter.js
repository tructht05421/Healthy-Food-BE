const express = require("express");
const conversationRouter = express.Router();

const {
  createConversation,
  updateStatusConversation,
  createMessage,
  getMessages,
  getCheckedConversations,
  getActiveConversations,
  getPendingConversations,
  getUserConversations,
} = require("../controllers/conversationController");
const { isAuthenticated, isAdmin, isNutritionist } = require("../middlewares/isAuthenticated");
// Tạo cuộc trò chuyện mới
conversationRouter.post("/", createConversation);

// Đặt route tĩnh trước route động để tránh xung đột
conversationRouter.get("/pending", getPendingConversations);

// Đặt route cụ thể trước route có tham số
conversationRouter.get("/:userId/active", getActiveConversations);
conversationRouter.get("/:userId/checked", getCheckedConversations);

// Route có tham số động
conversationRouter.get("/:userId", getUserConversations);

// Cập nhật trạng thái cuộc trò chuyện
conversationRouter.put("/status/:conversationId", updateStatusConversation);

// Tin nhắn trong conversation
conversationRouter
  .route("/:conversationId/messages", isAuthenticated)
  .post(createMessage)
  .get(getMessages);

module.exports = conversationRouter;
