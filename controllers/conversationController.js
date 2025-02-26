const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const catchAsync = require("../utils/catchAsync");

// Tạo cuộc trò chuyện mới
// Tạo cuộc trò chuyện mới
exports.createConversation = catchAsync(async (req, res) => {
  const { userId, topic } = req.body;

  if (!userId || !topic) {
    return res.status(400).json({ status: "fail", message: "Missing userId or topic" });
  }

  // Kiểm tra xem người dùng đã có cuộc trò chuyện với chủ đề này chưa
  const existingConversation = await Conversation.findOne({ userId, topic });

  if (existingConversation) {
    return res.status(400).json({
      status: "fail",
      message: "User already has a conversation with this topic.",
      data: existingConversation,
    });
  }

  // Nếu chưa có, tạo mới cuộc trò chuyện
  const conversation = await Conversation.create({
    userId,
    topic,
  });

  res.status(201).json({
    status: "success",
    data: conversation,
  });
});

// Lấy danh sách cuộc trò chuyện của người dùng
exports.getUserConversations = catchAsync(async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ status: "fail", message: "Missing userId" });
  }

  const conversations = await Conversation.find({ userId })
    .populate("userId", "name email")
    .populate("nutritionistId", "name email");

  res.status(200).json({
    status: "success",
    data: conversations,
  });
});

// Cập nhật trạng thái cuộc trò chuyện
exports.updateStatusConversation = catchAsync(async (req, res) => {
  const { conversationId } = req.params;
  const { nutritionistId } = req.body; // Lấy nutritionistId từ body

  // Kiểm tra đầu vào
  if (!conversationId || !nutritionistId) {
    return res.status(400).json({
      status: "fail",
      message: "Missing conversationId or nutritionistId",
    });
  }

  // Tìm cuộc trò chuyện
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    return res.status(404).json({
      status: "fail",
      message: "Conversation not found",
    });
  }

  // Nếu đã có nutritionistId => đã được nhận tư vấn, không thể check nữa
  if (conversation.nutritionistId) {
    return res.status(400).json({
      status: "fail",
      message: "Conversation already assigned to a nutritionist",
    });
  }

  // Nếu nutritionist chưa check trước đó, thêm vào danh sách checkedBy
  if (!conversation.checkedBy.includes(nutritionistId)) {
    conversation.checkedBy.push(nutritionistId);
    await conversation.save();
  }

  res.status(200).json({
    status: "success",
    message: "Conversation checked successfully",
    data: conversation,
  });
});

// Tạo tin nhắn mới
exports.createMessage = catchAsync(async (req, res) => {
  const { senderId, text, imageUrl, videoUrl } = req.body;
  const { conversationId } = req.params;

  // 1. Kiểm tra đầu vào
  if (!conversationId || !senderId) {
    return res.status(400).json({
      status: "fail",
      message: "Missing conversationId or senderId",
    });
  }

  // 2. Lấy thông tin cuộc trò chuyện
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    return res.status(404).json({
      status: "fail",
      message: "Conversation not found",
    });
  }

  // 3. Nếu sender là nutritionist đầu tiên phản hồi -> cập nhật nutritionistId
  if (
    conversation.status === "pending" &&
    !conversation.nutritionistId &&
    senderId !== conversation.userId.toString()
  ) {
    conversation.nutritionistId = senderId;
    conversation.status = "active";
    await conversation.save();
  }

  // 4. Kiểm tra quyền gửi tin nhắn
  const isUser = senderId === conversation.userId.toString();
  const isNutritionist =
    conversation.nutritionistId && senderId === conversation.nutritionistId.toString();

  if (!isUser && !isNutritionist) {
    return res.status(403).json({
      status: "fail",
      message: "Not authorized to send message in this conversation",
    });
  }

  // 5. Tạo tin nhắn mới
  const message = await Message.create({
    conversationId,
    senderId,
    text,
    imageUrl,
    videoUrl,
  });

  // 6. Cập nhật conversation với tin nhắn mới nhất
  conversation.messages.push(message._id);
  conversation.lastMessage = text || "New message";
  conversation.updatedAt = Date.now();
  await conversation.save();

  res.status(201).json({
    status: "success",
    data: message,
  });
});

// Lấy tất cả tin nhắn trong cuộc trò chuyện
exports.getMessages = catchAsync(async (req, res) => {
  const { conversationId } = req.params;

  if (!conversationId) {
    return res.status(400).json({ status: "fail", message: "Missing conversationId" });
  }

  // Tìm cuộc trò chuyện và lấy tất cả tin nhắn liên quan đến conversationId
  const conversation = await Conversation.findById(conversationId)
    .populate({
      path: "messages", // Đảm bảo bạn populate tin nhắn
      model: "Message", // Đảm bảo bạn chỉ định model là 'Message'
    })
    .exec(); // Đảm bảo trả về tất cả tin nhắn

  if (!conversation) {
    return res.status(404).json({ status: "fail", message: "Conversation not found" });
  }

  res.status(200).json({
    status: "success",
    data: conversation.messages || [], // Trả về mảng tin nhắn
  });
});

// Lấy các cuộc trò chuyện đã xem (Checked)
// Controller xử lý lấy các cuộc trò chuyện nutritionist đã xem (Checked)
exports.getCheckedConversations = catchAsync(async (req, res) => {
  const { userId } = req.params; // userId ở đây là của nutritionist đang đăng nhập

  // Kiểm tra đầu vào
  if (!userId) {
    return res.status(400).json({
      status: "fail",
      message: "Missing userId",
    });
  }

  // Lấy tất cả conversation có chứa userId trong checkedBy
  const checkedConversations = await Conversation.find({
    checkedBy: userId, // Chỉ lấy những cuộc trò chuyện nutritionist này đã check
    nutritionistId: null, // Chỉ lấy những cuộc trò chuyện chưa có ai nhận
  }).populate("userId", "username email");

  res.status(200).json({
    status: "success",
    results: checkedConversations.length,
    data: checkedConversations,
  });
});

// Lấy các cuộc trò chuyện đang hoạt động (Active)
exports.getActiveConversations = catchAsync(async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        status: "fail",
        message: "Missing userId",
      });
    }

    // Truy vấn các cuộc trò chuyện có nutritionistId = userId và status là "active"
    const conversations = await Conversation.find({
      nutritionistId: userId,
      status: "active",
    })
      .populate("userId", "name email")
      .populate("nutritionistId", "name email")
      .exec();

    // Kiểm tra nếu không tìm thấy cuộc trò chuyện nào
    if (!conversations || conversations.length === 0) {
      return res.status(404).json({
        status: "fail",
        message: "No active conversations found",
      });
    }

    res.status(200).json({
      status: "success",
      data: conversations,
    });
  } catch (error) {
    console.error("Error fetching active conversations:", error);
    res.status(500).json({
      status: "fail",
      message: "Internal Server Error",
      error: error.message,
    });
  }
});

// Lấy các cuộc trò chuyện đang chờ (Pending)
// Chỉ lấy những cuộc trò chuyện có status là "pending" và nutritionistId chưa được gán (null)
exports.getPendingConversations = catchAsync(async (req, res) => {
  try {
    const conversations = await Conversation.find({
      status: "pending",
      nutritionistId: null,
    })
      .populate("userId", "name email")
      .populate("nutritionistId", "name email")
      .exec();

    if (!conversations || conversations.length === 0) {
      return res.status(404).json({
        status: "fail",
        message: "No pending conversations found",
      });
    }

    res.status(200).json({
      status: "success",
      data: conversations,
    });
  } catch (error) {
    console.error("Error fetching pending conversations:", error);
    res.status(500).json({
      status: "fail",
      message: "Internal Server Error",
      error: error.message,
    });
  }
});
