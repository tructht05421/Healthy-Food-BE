const express = require("express");
const commentRatingRouter = express.Router();

const {
  createComment,
  getCommentsByDish,
  updateComment,
  deleteComment,
  likeComment,
  getLikesByComment,
  unlikeComment,
  rateRecipe,
  getRatingsByRecipe,
  deleteRating,
} = require("../controllers/commentController");


// Rating Routes - ƯU TIÊN TRƯỚC để tránh conflict
commentRatingRouter.post("/rate", rateRecipe);  // Đánh giá món ăn
commentRatingRouter.get("/rate/:recipeId", getRatingsByRecipe); // Lấy danh sách đánh giá của món ăn
commentRatingRouter.delete("/rate/:recipeId", deleteRating); // Xóa đánh giá

// Comment Routes - ĐỂ SAU
commentRatingRouter.post("/:dishId/comment", createComment); // Tạo bình luận cho món ăn
commentRatingRouter.get("/:dishId/comment", getCommentsByDish); // Lấy tất cả bình luận của món ăn
commentRatingRouter.put("/comment/:commentId", updateComment); // Cập nhật bình luận
commentRatingRouter.delete("/comment/:commentId", deleteComment); // Xóa bình luận
// Like Comment Routes
commentRatingRouter.post("/:commentId/like", likeComment);
commentRatingRouter.get("/like/:commentId", getLikesByComment); // Lấy danh sách lượt thích của bình luận
commentRatingRouter.delete("/like/:commentId", unlikeComment); // Bỏ thích bình luận



module.exports = commentRatingRouter;
