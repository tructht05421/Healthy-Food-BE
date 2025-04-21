const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

let io;
exports.initialize = (socketIoInstance) => {
  if (!socketIoInstance) {
    console.error("socketIoInstance is undefined or null");
    return;
  }
  io = socketIoInstance;
  console.log("conversationService initialized with io");
};

exports.createMessage = async (conversationId, senderId, text, imageUrl, videoUrl, type) => {
  if (!conversationId || !senderId) {
    throw Object.assign(new Error("Missing conversationId or senderId"), { status: 400 });
  }

  try {
    const message = await Message.create({
      conversationId,
      senderId,
      text,
      imageUrl,
      videoUrl,
      type: type || "text",
    });

    const existingConversation = await Conversation.findById(conversationId);
    if (!existingConversation) {
      throw Object.assign(new Error("Conversation not found"), { status: 404 });
    }

    const isUser =
      senderId === (existingConversation.userId ? existingConversation.userId.toString() : null);
    const isNutritionist = existingConversation.nutritionistId
      ? senderId === existingConversation.nutritionistId.toString()
      : false;

    if (!isUser && !isNutritionist) {
      throw Object.assign(new Error("Not authorized to send message in this conversation"), {
        status: 403,
      });
    }

    const updateFields = {
      lastMessage: text || imageUrl || videoUrl || "New message",
      updatedAt: Date.now(),
    };

    if (
      existingConversation.status === "pending" &&
      !existingConversation.nutritionistId &&
      senderId !== existingConversation.userId?.toString()
    ) {
      updateFields.nutritionistId = senderId;
      updateFields.status = "active";
    }

    const conversation = await Conversation.findByIdAndUpdate(
      conversationId,
      {
        $push: { messages: message._id },
        $set: updateFields,
      },
      { new: true }
    );

    if (!conversation) {
      throw Object.assign(new Error("Conversation not found"), { status: 404 });
    }

    if (io) {
      console.log(`Emitting message to room ${conversationId}:`, message);
      io.to(conversationId).emit("receive_message", message);
    } else {
      console.warn("WebSocket io instance not initialized");
    }

    return message;
  } catch (error) {
    console.error("Error in createMessage:", error);
    throw Object.assign(new Error("Internal server error"), {
      status: 500,
      details: error.message,
    });
  }
};
exports.createConversation = async (userId, topic) => {
  if (!userId || !topic) {
    throw Object.assign(new Error("Missing userId or topic"), { status: 400 });
  }

  const existingConversation = await Conversation.findOne({ userId, topic });
  if (existingConversation) {
    throw Object.assign(new Error("User already has a conversation with this topic."), {
      status: 400,
      data: existingConversation,
    });
  }

  const newConversation = await Conversation.create({ userId, topic });
  return {
    status: 200,
    data: newConversation,
  };
};

exports.getUserConversations = async (userId) => {
  if (!userId) {
    throw Object.assign(new Error("Missing userId"), { status: 400 });
  }

  return await Conversation.find({ userId })
    .populate("userId", "name email")
    .populate("nutritionistId", "name email");
};

exports.updateStatusConversation = async (conversationId, nutritionistId, status) => {
  if (!conversationId || !nutritionistId) {
    throw Object.assign(new Error("Missing conversationId or nutritionistId"), { status: 400 });
  }

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    throw Object.assign(new Error("Conversation not found"), { status: 404 });
  }

  if (conversation.nutritionistId) {
    throw Object.assign(new Error("Conversation already assigned to a nutritionist"), {
      status: 400,
    });
  }

  if (status === "checked" && !conversation.checkedBy.includes(nutritionistId)) {
    conversation.checkedBy.push(nutritionistId);
    conversation.status = "checked";
  } else if (status === "active") {
    conversation.nutritionistId = nutritionistId;
    conversation.status = "active";
  } else {
    throw Object.assign(new Error("Invalid status"), { status: 400 });
  }

  return await conversation.save();
};

exports.getMessages = async (conversationId) => {
  if (!conversationId) {
    throw Object.assign(new Error("Missing conversationId"), { status: 400 });
  }

  const conversation = await Conversation.findById(conversationId)
    .populate({
      path: "messages",
      model: "Message",
    })
    .exec();

  if (!conversation) {
    throw Object.assign(new Error("Conversation not found"), { status: 404 });
  }

  return conversation.messages || [];
};

exports.getCheckedConversations = async (userId) => {
  if (!userId) {
    throw Object.assign(new Error("Missing userId"), { status: 400 });
  }

  return await Conversation.find({
    checkedBy: userId,
    status: "checked",
  }).populate("userId", "username email");
};

exports.getActiveConversations = async (userId) => {
  if (!userId) {
    throw Object.assign(new Error("Missing userId"), { status: 400 });
  }

  const conversations = await Conversation.find({
    nutritionistId: userId,
    status: "active",
  })
    .populate("userId", "name email")
    .populate("nutritionistId", "name email")
    .exec();

  if (!conversations || conversations.length === 0) {
    throw Object.assign(new Error("No active conversations found"), { status: 404 });
  }

  return conversations;
};

exports.getPendingConversations = async () => {
  return await Conversation.find({
    status: "pending",
    nutritionistId: null,
  })
    .populate("userId", "name email")
    .populate("nutritionistId", "name email")
    .exec();
};
