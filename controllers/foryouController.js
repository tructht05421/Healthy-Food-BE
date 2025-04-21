const mongoose = require("mongoose");
const Dish = require("../models/Dish");
const MedicalCondition = require("../models/MedicalCondition");
const UserModel = require("../models/UserModel");
const UserPreferenceModel = require("../models/UserPrefenrenceModel");
const Recipe = require("../models/Recipe");

const foryouController = {
  getForyou: async (req, res) => {
    try {
      const userId = req.user?.id || req.params.userId;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const type = req.query.type || "";
      const skip = (page - 1) * limit;

      if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({
          success: false,
          message: "userId không hợp lệ!",
        });
      }

      const user = await UserModel.findOne({
        _id: userId,
        isDelete: false,
        isBan: false,
      });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy người dùng!",
        });
      }

      const userPreferenceId = user.userPreferenceId;
      if (!userPreferenceId) {
        return res.status(404).json({
          success: false,
          message: "Người dùng chưa có sở thích (userPreferenceId) được thiết lập!",
        });
      }

      const userPreference = await UserPreferenceModel.findOne({
        _id: userPreferenceId,
        userId: userId,
        isDelete: false,
      }).populate("underDisease");
      if (!userPreference) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy sở thích người dùng!",
        });
      }

      const underDiseases = userPreference.underDisease || [];
      const hateIngredients = userPreference.hate || [];

      console.log("underDiseases:", underDiseases);
      console.log("hateIngredients:", hateIngredients);

      if (underDiseases.length === 0 && hateIngredients.length === 0) {
        const query = {
          isVisible: true,
          isDelete: false,
        };

        if (type) {
          query.type = type; // Không chuẩn hóa thành chữ thường
        }

        console.log("Query (no conditions):", query);

        const totalItems = await Dish.countDocuments(query);
        const foryouItems = await Dish.find(query)
          .populate("recipeId")
          .populate("medicalConditionId")
          .skip(skip)
          .limit(limit);

        console.log("foryouItems (no conditions):", foryouItems);

        return res.status(200).json({
          success: true,
          message: "Danh sách món ăn được lấy thành công (không có điều kiện y tế hoặc ghét)",
          data: {
            items: foryouItems,
            totalItems,
            currentPage: page,
            totalPages: Math.ceil(totalItems / limit),
            itemsPerPage: limit,
          },
        });
      }

      const medicalConditions = await MedicalCondition.find({
        _id: { $in: underDiseases },
        isDelete: false,
      })
        .populate("restrictedFoods")
        .populate("recommendedFoods");

      const restrictedFoods = medicalConditions
        .flatMap((condition) =>
          (condition.restrictedFoods || []).map((dish) => dish._id?.toString())
        )
        .filter(Boolean);

      const recommendedFoods = medicalConditions
        .flatMap((condition) =>
          (condition.recommendedFoods || []).map((dish) => dish._id?.toString())
        )
        .filter(Boolean);

      console.log("restrictedFoods:", restrictedFoods);
      console.log("recommendedFoods:", recommendedFoods);

      const nutritionalConstraints = medicalConditions.reduce((acc, condition) => {
        if (condition.nutritionalConstraints) {
          if (condition.nutritionalConstraints.carbs)
            acc.carbs = Math.min(acc.carbs || Infinity, condition.nutritionalConstraints.carbs);
          if (condition.nutritionalConstraints.fat)
            acc.fat = Math.min(acc.fat || Infinity, condition.nutritionalConstraints.fat);
          if (condition.nutritionalConstraints.protein)
            acc.protein = Math.min(
              acc.protein || Infinity,
              condition.nutritionalConstraints.protein
            );
          if (condition.nutritionalConstraints.calories)
            acc.calories = Math.min(
              acc.calories || Infinity,
              condition.nutritionalConstraints.calories
            );
        }
        return acc;
      }, {});

      let restrictedRecipeIds = [];
      if (hateIngredients.length > 0) {
        const recipesWithHatedIngredients = await Recipe.find({
          "ingredients.ingredientId": { $in: hateIngredients },
        });
        restrictedRecipeIds = recipesWithHatedIngredients.map((recipe) => recipe._id.toString());
      }

      const query = {
        isVisible: true,
        isDelete: false,
        _id: { $nin: restrictedFoods },
        $or: [{ recipeId: { $nin: restrictedRecipeIds } }, { recipeId: { $exists: false } }],
      };

      if (type) {
        query.type = type; // Không chuẩn hóa thành chữ thường
      }

      if (nutritionalConstraints.carbs) query.carbs = { $lte: nutritionalConstraints.carbs };
      if (nutritionalConstraints.fat) query.fat = { $lte: nutritionalConstraints.fat };
      if (nutritionalConstraints.protein) query.protein = { $lte: nutritionalConstraints.protein };
      if (nutritionalConstraints.calories)
        query.calories = { $lte: nutritionalConstraints.calories };

      console.log("Query (with conditions):", query);

      const totalItems = await Dish.countDocuments(query);
      const foryouItems = await Dish.find(query)
        .populate("recipeId")
        .populate("medicalConditionId")
        .skip(skip)
        .limit(limit);

      console.log("foryouItems (with conditions):", foryouItems);

      const sortedItems = foryouItems.sort((a, b) => {
        const aIsRecommended = recommendedFoods.includes(a._id.toString());
        const bIsRecommended = recommendedFoods.includes(b._id.toString());
        return bIsRecommended - aIsRecommended;
      });

      if (sortedItems.length === 0) {
        return res.status(200).json({
          success: true,
          message: "Không tìm thấy món ăn nào khớp với tiêu chí",
          data: {
            items: [],
            totalItems: 0,
            currentPage: page,
            totalPages: 0,
            itemsPerPage: limit,
          },
        });
      }

      return res.status(200).json({
        success: true,
        message: "Danh sách món ăn được lấy thành công dựa trên điều kiện y tế và sở thích",
        data: {
          items: sortedItems,
          totalItems,
          currentPage: page,
          totalPages: Math.ceil(totalItems / limit),
          itemsPerPage: limit,
        },
      });
    } catch (error) {
      console.error("Lỗi trong getForyou:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách món ăn",
        error: error.message,
      });
    }
  },

  getForYouDishType: async (req, res) => {
    try {
      // Lấy danh sách các loại món ăn duy nhất từ model Dish
      const dishTypes = await Dish.distinct("type", {
        isVisible: true,
        isDelete: false,
      });

      // Kiểm tra dữ liệu trả về
      if (!Array.isArray(dishTypes) || dishTypes.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy loại món ăn nào!",
        });
      }

      // Chuẩn hóa dữ liệu trả về: mỗi type sẽ có id, name và image
      const formattedDishTypes = dishTypes.map((type, index) => ({
        id: index + 1,
        name: type,
        image: `https://via.placeholder.com/200?text=${type}`, // Có thể thay bằng hình ảnh thực tế nếu có
      }));

      return res.status(200).json({
        success: true,
        message: "Danh sách loại món ăn được lấy thành công",
        data: formattedDishTypes,
      });
    } catch (error) {
      console.error("Lỗi trong getForYouDishType:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách loại món ăn",
        error: error.message,
      });
    }
  },
};

module.exports = foryouController;
