const express = require("express");
const foryouRouter = express.Router();
const { getForyou, getForYouDishType } = require("../controllers/foryouController");
// Route mới: Lấy danh sách loại món ăn
foryouRouter.get("/dish-types", getForYouDishType);
// Route hiện có: Lấy danh sách món ăn đã lọc
foryouRouter.get("/:userId", getForyou);

module.exports = foryouRouter;
