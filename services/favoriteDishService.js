const UserFavoriteDishes = require("../models/UserFavoriteDishes");

exports.addFavoriteDish = async (userId, dishId) => {
  if (!userId || !dishId) {
    throw Object.assign(new Error("userId và dishId là bắt buộc"), { status: 400 });
  }

  return await UserFavoriteDishes.create({ userId, dishId, isLike: true });
};

exports.getUserFavoriteDishes = async (userId) => {
  return await UserFavoriteDishes.find({ userId, isLike: true })
    .populate("dishId", "name imageUrl description calories protein carbs fat totalServing")
    .sort({ createdAt: -1 });
};

exports.checkFavoriteDish = async (userId, dishId) => {
  const favorite = await UserFavoriteDishes.findOne({ userId, dishId, isLike: true });
  return !!favorite;
};

exports.removeFavoriteDish = async (userId, dishId) => {
  const result = await UserFavoriteDishes.updateMany(
    { userId, dishId },
    { $set: { isLike: false } }
  );

  if (result.matchedCount === 0) {
    throw Object.assign(new Error("Món ăn không tồn tại trong danh sách yêu thích"), {
      status: 404,
    });
  }

  return result;
};
