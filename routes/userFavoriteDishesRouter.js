const express = require("express");
const userFavoriteDishesRouter = express.Router();
const {
  addFavoriteDish,
  getUserFavoriteDishes,
  checkFavoriteDish,
  removeFavoriteDish,
} = require("../controllers/userFavoriteDishesController");

// Thêm món ăn vào danh sách yêu thích
userFavoriteDishesRouter.post("/", addFavoriteDish);

// Lấy danh sách món ăn yêu thích của user
userFavoriteDishesRouter.get("/:userId", getUserFavoriteDishes);

// Kiểm tra xem món ăn có trong danh sách yêu thích không
userFavoriteDishesRouter.get("/:userId/:dishId", checkFavoriteDish);

// Xóa món ăn khỏi danh sách yêu thích
userFavoriteDishesRouter.delete("/", removeFavoriteDish);

module.exports = userFavoriteDishesRouter;
