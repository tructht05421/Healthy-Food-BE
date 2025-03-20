const mongoose = require("mongoose");

const commentDishSchema = new mongoose.Schema(
  {
    dishId: { type: mongoose.Schema.Types.ObjectId, ref: "Dish", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true },
    likeCount: { type: Number, default: 0 }, 
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }] 
  },
  { timestamps: true }
);

module.exports = mongoose.model("CommentDish", commentDishSchema);
