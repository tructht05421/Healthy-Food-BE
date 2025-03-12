const CommentDish = require("../models/commentRating/CommentDish");
const LikeCommentDish = require("../models/commentRating/LikeCommentDish");
const RateRecipe = require("../models/commentRating/RateRecipe");

// CRUD cho CommentDish
exports.createComment = async (req, res) => {
    try {
        const { dishId } = req.params; // Lấy dishId từ URL
        const { userId, text } = req.body; // 🔥 Đổi từ `content` -> `text`

        // Kiểm tra dữ liệu đầu vào (chỉ kiểm tra userId và text)
        if (!userId || !text) { // 🔥 Bỏ kiểm tra dishId
            return res.status(400).json({
                status: "fail",
                message: "User ID và Text là bắt buộc!",
            });
        }

        // Tạo bình luận mới
        const newComment = new CommentDish({
            dishId,
            userId,
            text, // 🔥 Sử dụng đúng field `text`
            createdAt: new Date(),
        });

        await newComment.save();

        res.status(201).json({
            status: "success",
            data: newComment,
        });
    } catch (error) {
        res.status(500).json({
            status: "fail",
            message: error.message,
        });
    }
};

  

  
exports.getCommentsByDish = async (req, res) => {
    try {
      const { dishId } = req.params;
  
      // Kiểm tra nếu dishId không tồn tại
      if (!dishId) {
        return res.status(400).json({ status: "fail", message: "Dish ID is required" });
      }
  
      // Tìm tất cả bình luận theo dishId
      const comments = await CommentDish.find({ dishId });
  
      if (!comments.length) {
        return res.status(404).json({ status: "fail", message: "No comments found for this dish" });
      }
  
      res.status(200).json({
        status: "success",
        results: comments.length,
        data: comments,
      });
    } catch (error) {
      res.status(500).json({ status: "fail", message: error.message });
    }
  };
    

exports.updateComment = async (req, res) => {
  try {
    const updatedComment = await CommentDish.findByIdAndUpdate(
      req.params.commentId,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedComment) {
      return res.status(404).json({ status: "fail", message: "Comment not found" });
    }
    res.status(200).json({ status: "success", data: updatedComment });
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const deletedComment = await CommentDish.findByIdAndDelete(req.params.commentId);
    if (!deletedComment) {
      return res.status(404).json({ status: "fail", message: "Comment not found" });
    }
    res.status(200).json({ status: "success", message: "Comment deleted" });
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
};

// CRUD cho LikeCommentDish
exports.likeComment = async (req, res) => {
    try {
      const { commentId } = req.params;
      const { userId } = req.body;
  
      if (!commentId || !userId) {
        return res.status(400).json({ status: "fail", message: "Comment ID và User ID là bắt buộc!" });
      }
  
      const existingLike = await LikeCommentDish.findOne({ commentId, userId });
  
      if (existingLike) {
        // Unlike
        await LikeCommentDish.findByIdAndDelete(existingLike._id);
        await CommentDish.findByIdAndUpdate(commentId, { $inc: { likeCount: -1 } });
        return res.status(200).json({ status: "success", message: "Unlike thành công!" });
      }
  
      // Like
      const like = new LikeCommentDish({ commentId, userId });
      await like.save();
      await CommentDish.findByIdAndUpdate(commentId, { $inc: { likeCount: 1 } });
  
      res.status(201).json({ status: "success", data: like });
    } catch (error) {
      res.status(500).json({ status: "fail", message: error.message });
    }
  };
  
exports.getLikesByComment = async (req, res) => {
  try {
    const likes = await LikeCommentDish.find({ commentId: req.params.commentId });
    res.status(200).json({ status: "success", data: likes });
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
};

exports.unlikeComment = async (req, res) => {
  try {
    const removedLike = await LikeCommentDish.findOneAndDelete({
      commentId: req.params.commentId,
      userId: req.body.userId,
    });
    if (!removedLike) {
      return res.status(404).json({ status: "fail", message: "Like not found" });
    }
    res.status(200).json({ status: "success", message: "Like removed" });
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
};

// CRUD cho RateRecipe
exports.rateRecipe = async (req, res) => {
  try {
      console.log("📢 Received body:", req.body); // Debug request body

      const { recipeId, userId, star } = req.body;

      if (!recipeId || !userId || star === undefined) {
          console.log("❌ Missing fields! req.body:", req.body); // Debug
          return res.status(400).json({ status: "fail", message: "Recipe ID, User ID và Star là bắt buộc!" });
      }

      if (star < 1 || star > 5) {
          return res.status(400).json({ status: "fail", message: "Rating must be between 1 and 5 stars" });
      }

      const rating = await RateRecipe.findOneAndUpdate(
          { recipeId, userId },
          { star },
          { new: true, upsert: true }
      );

      res.status(201).json({ status: "success", data: rating });
  } catch (error) {
      console.error("❌ Error:", error);
      res.status(400).json({ status: "fail", message: error.message });
  }
};

  
  // 2️⃣ API lấy danh sách đánh giá của Recipe
  exports.getRatingsByRecipe = async (req, res) => {
    try {
      const { recipeId } = req.params;
      const ratings = await RateRecipe.find({ recipeId }).populate("userId", "name email");
  
      res.status(200).json({ status: "success", data: ratings });
    } catch (error) {
      res.status(500).json({ status: "fail", message: error.message });
    }
  };
  
  // 3️⃣ API xóa đánh giá
  exports.deleteRating = async (req, res) => {
    try {
      const { recipeId } = req.params;
      const { userId } = req.body;
  
      const deletedRating = await RateRecipe.findOneAndDelete({ recipeId, userId });
  
      if (!deletedRating) {
        return res.status(404).json({ status: "fail", message: "Rating not found or already deleted" });
      }
  
      res.status(200).json({ status: "success", message: "Rating deleted successfully" });
    } catch (error) {
      res.status(500).json({ status: "fail", message: error.message });
    }
  };