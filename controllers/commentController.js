const commentService = require("../services/commentService");

exports.createComment = async (req, res) => {
  try {
    const { dishId } = req.params;
    const { userId, text } = req.body;
    const newComment = await commentService.createComment(dishId, userId, text);
    res.status(201).json({ status: "success", data: newComment });
  } catch (error) {
    res.status(error.status || 500).json({ status: "fail", message: error.message });
  }
};

exports.getCommentsByDish = async (req, res) => {
  try {
    const { dishId } = req.params;
    const comments = await commentService.getCommentsByDish(dishId);
    res.status(200).json({
      status: "success",
      data: comments,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      status: "error",
      message: error.message || "Internal Server Error",
    });
  }
};

exports.updateComment = async (req, res) => {
  try {
    const updatedComment = await commentService.updateComment(req.params.commentId, req.body);
    res.status(200).json({ status: "success", data: updatedComment });
  } catch (error) {
    res.status(error.status || 500).json({ status: "fail", message: error.message });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    await commentService.deleteComment(req.params.commentId);
    res.status(200).json({ status: "success", message: "Comment deleted" });
  } catch (error) {
    res.status(error.status || 500).json({ status: "fail", message: error.message });
  }
};

exports.likeComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { userId } = req.body;
    const result = await commentService.likeComment(commentId, userId);
    res
      .status(result.status === "liked" ? 201 : 200)
      .json({ status: "success", message: result.message });
  } catch (error) {
    res.status(error.status || 500).json({ status: "fail", message: error.message });
  }
};

exports.getLikesByComment = async (req, res) => {
  try {
    const likes = await commentService.getLikesByComment(req.params.commentId);
    res.status(200).json({ status: "success", data: likes });
  } catch (error) {
    res.status(error.status || 500).json({ status: "fail", message: error.message });
  }
};

exports.unlikeComment = async (req, res) => {
  try {
    await commentService.unlikeComment(req.params.commentId, req.body.userId);
    res.status(200).json({ status: "success", message: "Like removed" });
  } catch (error) {
    res.status(error.status || 500).json({ status: "fail", message: error.message });
  }
};

exports.rateRecipe = async (req, res) => {
  try {
    const { recipeId, userId, star } = req.body;
    const rating = await commentService.rateRecipe(recipeId, userId, star);
    res.status(201).json({ status: "success", data: rating });
  } catch (error) {
    res.status(error.status || 400).json({ status: "fail", message: error.message });
  }
};

exports.getRatingsByRecipe = async (req, res) => {
  try {
    const ratings = await commentService.getRatingsByRecipe(req.params.recipeId);
    res.status(200).json({ status: "success", data: ratings });
  } catch (error) {
    res.status(error.status || 500).json({ status: "fail", message: error.message });
  }
};

exports.deleteRating = async (req, res) => {
  try {
    await commentService.deleteRating(req.params.recipeId, req.body.userId);
    res.status(200).json({ status: "success", message: "Rating deleted successfully" });
  } catch (error) {
    res.status(error.status || 500).json({ status: "fail", message: error.message });
  }
};
