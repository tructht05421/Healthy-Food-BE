const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      default: null, // Tin nhắn dạng văn bản
    },
    imageUrl: {
      type: String,
      default: null, // Tin nhắn dạng ảnh
    },
    videoUrl: {
      type: String,
      default: null, // Tin nhắn dạng video
    },
    type: {
      type: String,
      enum: ["text", "image", "video"], // Chỉ cho phép các giá trị này
      default: "text", // Mặc định là text
    },
    isRead: {
      type: Boolean,
      default: false, // Trạng thái đọc
    },
  },
  {
    timestamps: true, // Lưu thời gian tạo và cập nhật
  }
);

const Message = mongoose.model("Message", messageSchema);
module.exports = Message;
