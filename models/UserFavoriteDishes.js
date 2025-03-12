const mongoose = require("mongoose");

const UserFavoriteDishesSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    dishId: { type: mongoose.Schema.Types.ObjectId, ref: "Dish", required: true },
    isLike: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updated_at" } } // Tự động tạo createdAt & updated_at
);

module.exports = mongoose.model("UserFavoriteDishes", UserFavoriteDishesSchema);
