const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    nutritionistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    topic: {
      type: String,
      required: true,
    },
    messages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
      },
    ],
    lastMessage: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["active", "pending", "checked"],
      default: "pending",
    },
    checkedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Lưu danh sách nutritionist đã chuyển trạng thái "checked"
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Conversation = mongoose.model("Conversation", conversationSchema);
module.exports = Conversation;
