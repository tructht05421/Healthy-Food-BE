const CommentDish = require("../models/commentRating/CommentDish");
const LikeCommentDish = require("../models/commentRating/LikeCommentDish");
const RateRecipe = require("../models/commentRating/RateRecipe");

exports.createComment = async (dishId, userId, text) => {
  if (!userId || !text) {
    throw Object.assign(new Error("User ID và Text là bắt buộc!"), { status: 400 });
  }

  const newComment = new CommentDish({
    dishId,
    userId,
    text,
    createdAt: new Date(),
  });

  return await newComment.save();
};

exports.getCommentsByDish = async (dishId) => {
  if (!dishId) {
    throw Object.assign(new Error("Dish ID is required"), { status: 400 });
  }

  const comments = await CommentDish.find({ dishId }).populate("userId", "name email");
  if (!comments.length) {
    throw Object.assign(new Error("No comments found for this dish"), { status: 404 });
  }

  return comments;
};

exports.updateComment = async (commentId, data) => {
  const updatedComment = await CommentDish.findByIdAndUpdate(commentId, data, {
    new: true,
    runValidators: true,
  });
  if (!updatedComment) {
    throw Object.assign(new Error("Comment not found"), { status: 404 });
  }
  return updatedComment;
};

exports.deleteComment = async (commentId) => {
  const deletedComment = await CommentDish.findByIdAndDelete(commentId);
  if (!deletedComment) {
    throw Object.assign(new Error("Comment not found"), { status: 404 });
  }
};

exports.likeComment = async (commentId, userId) => {
  if (!commentId || !userId) {
    throw Object.assign(new Error("Comment ID và User ID là bắt buộc!"), { status: 400 });
  }

  const comment = await CommentDish.findById(commentId);
  if (!comment) {
    throw Object.assign(new Error("Không tìm thấy bình luận!"), { status: 404 });
  }

  const isLiked = comment.likedBy.includes(userId);

  if (isLiked) {
    await CommentDish.findByIdAndUpdate(commentId, {
      $inc: { likeCount: -1 },
      $pull: { likedBy: userId },
    });
    return { status: "unliked", message: "Unlike thành công!" };
  } else {
    await CommentDish.findByIdAndUpdate(commentId, {
      $inc: { likeCount: 1 },
      $addToSet: { likedBy: userId },
    });
    return { status: "liked", message: "Like thành công!" };
  }
};

exports.getLikesByComment = async (commentId) => {
  return await LikeCommentDish.find({ commentId }).select("userId");
};

exports.unlikeComment = async (commentId, userId) => {
  const removedLike = await LikeCommentDish.findOneAndDelete({ commentId, userId });
  if (!removedLike) {
    throw Object.assign(new Error("Like not found"), { status: 404 });
  }
};

exports.rateRecipe = async (recipeId, userId, star) => {
  if (!recipeId || !userId || star === undefined) {
    throw Object.assign(new Error("Recipe ID, User ID và Star là bắt buộc!"), { status: 400 });
  }

  if (star < 1 || star > 5) {
    throw Object.assign(new Error("Rating must be between 1 and 5 stars"), { status: 400 });
  }

  return await RateRecipe.findOneAndUpdate(
    { recipeId, userId },
    { star },
    { new: true, upsert: true }
  );
};

exports.getRatingsByRecipe = async (recipeId) => {
  return await RateRecipe.find({ recipeId }).populate("userId", "name email");
};

exports.deleteRating = async (recipeId, userId) => {
  const deletedRating = await RateRecipe.findOneAndDelete({ recipeId, userId });
  if (!deletedRating) {
    throw Object.assign(new Error("Rating not found or already deleted"), { status: 404 });
  }
};
