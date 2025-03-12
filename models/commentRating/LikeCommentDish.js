const mongoose = require("mongoose");

const likeCommentDishSchema = new mongoose.Schema(
  {
    commentId: { type: mongoose.Schema.Types.ObjectId, ref: "CommentDish", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    isLike: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("LikeCommentDish", likeCommentDishSchema);
