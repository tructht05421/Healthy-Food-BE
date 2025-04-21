const catchAsync = require("../utils/catchAsync");
const conversationService = require("../services/conversationService");

exports.createConversation = catchAsync(async (req, res) => {
  const { userId, topic } = req.body;
  const conversation = await conversationService.createConversation(userId, topic);
  res.status(201).json({ status: "success", data: conversation });
});

exports.getUserConversations = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const conversations = await conversationService.getUserConversations(userId);
  res.status(200).json({ status: "success", data: conversations });
});

exports.updateStatusConversation = catchAsync(async (req, res) => {
  const { conversationId } = req.params;
  const { nutritionistId, status } = req.body;
  const conversation = await conversationService.updateStatusConversation(
    conversationId,
    nutritionistId,
    status
  );
  res.status(200).json({
    status: "success",
    message: "Conversation updated successfully",
    data: conversation,
  });
});

exports.createMessage = catchAsync(async (req, res) => {
  const { conversationId } = req.params;
  const { senderId, text, imageUrl, videoUrl, type } = req.body;
  const message = await conversationService.createMessage(
    conversationId,
    senderId,
    text,
    imageUrl,
    videoUrl,
    type
  );
  res.status(201).json({ status: "success", data: message });
});

exports.getMessages = catchAsync(async (req, res) => {
  const { conversationId } = req.params;
  const messages = await conversationService.getMessages(conversationId);
  res.status(200).json({ status: "success", data: messages });
});

exports.getCheckedConversations = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const checkedConversations = await conversationService.getCheckedConversations(userId);
  res.status(200).json({
    status: "success",
    results: checkedConversations.length,
    data: checkedConversations,
  });
});

exports.getActiveConversations = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const conversations = await conversationService.getActiveConversations(userId);
  res.status(200).json({ status: "success", data: conversations });
});

exports.getPendingConversations = catchAsync(async (req, res) => {
  const conversations = await conversationService.getPendingConversations();
  res.status(200).json({ status: "success", data: conversations });
});
