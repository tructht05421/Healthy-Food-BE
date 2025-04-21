const Dish = require("../models/Dish");
const MedicalCondition = require("../models/MedicalCondition");
const UserModel = require("../models/UserModel");
const UserPreferenceModel = require("../models/UserPrefenrenceModel");
const Recipe = require("../models/Recipe");

// Lấy danh sách món ăn "For You" với phân trang và lọc theo type
exports.getForyou = async (userId, { page = 1, limit = 10, type }) => {
  try {
    // Chuyển đổi page và limit thành số nguyên
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Kiểm tra userId
    if (!userId) {
      return {
        success: false,
        statusCode: 400,
        message: "userId là bắt buộc!",
      };
    }

    // Tìm user
    const user = await UserModel.findOne({
      _id: userId,
      isDelete: false,
      isBan: false,
    });
    if (!user) {
      return {
        success: false,
        statusCode: 404,
        message: "Không tìm thấy người dùng!",
      };
    }

    // Kiểm tra userPreferenceId
    const userPreferenceId = user.userPreferenceId;
    if (!userPreferenceId) {
      return {
        success: false,
        statusCode: 404,
        message: "Người dùng chưa có sở thích (userPreferenceId) được thiết lập!",
      };
    }

    // Tìm userPreference
    const userPreference = await UserPreferenceModel.findOne({
      _id: userPreferenceId,
      userId: userId,
      isDelete: false,
    }).populate("underDisease");
    if (!userPreference) {
      return {
        success: false,
        statusCode: 404,
        message: "Không tìm thấy sở thích người dùng!",
      };
    }

    const underDiseases = userPreference.underDisease || [];
    const hateIngredients = userPreference.hate || [];

    // Trường hợp không có điều kiện y tế hoặc nguyên liệu ghét
    if (underDiseases.length === 0 && hateIngredients.length === 0) {
      const query = {
        isVisible: true,
        isDelete: false,
      };

      // Thêm điều kiện lọc theo type nếu có
      if (type) {
        query.type = type; // Lọc theo type của món ăn
      }

      const totalItems = await Dish.countDocuments(query);

      const foryouItems = await Dish.find(query)
        .populate("recipeId")
        .populate("medicalConditionId")
        .skip(skip)
        .limit(limitNum);

      return {
        success: true,
        message: "Danh sách món ăn được lấy thành công (không có điều kiện y tế hoặc ghét)",
        data: {
          items: foryouItems,
          totalItems,
          currentPage: pageNum,
          totalPages: Math.ceil(totalItems / limitNum),
          itemsPerPage: limitNum,
        },
      };
    }

    // Lấy danh sách điều kiện y tế và các món bị hạn chế/khuyến nghị
    const medicalConditions = await MedicalCondition.find({
      _id: { $in: underDiseases },
      isDelete: false,
    })
      .populate("restrictedFoods")
      .populate("recommendedFoods");

    const restrictedFoods = medicalConditions
      .flatMap((condition) => condition.restrictedFoods)
      .map((dish) => dish._id.toString());

    const recommendedFoods = medicalConditions
      .flatMap((condition) => condition.recommendedFoods)
      .map((dish) => dish._id.toString());

    const nutritionalConstraints = medicalConditions.reduce((acc, condition) => {
      if (condition.nutritionalConstraints) {
        if (condition.nutritionalConstraints.carbs)
          acc.carbs = Math.min(acc.carbs || Infinity, condition.nutritionalConstraints.carbs);
        if (condition.nutritionalConstraints.fat)
          acc.fat = Math.min(acc.fat || Infinity, condition.nutritionalConstraints.fat);
        if (condition.nutritionalConstraints.protein)
          acc.protein = Math.min(acc.protein || Infinity, condition.nutritionalConstraints.protein);
        if (condition.nutritionalConstraints.calories)
          acc.calories = Math.min(
            acc.calories || Infinity,
            condition.nutritionalConstraints.calories
          );
      }
      return acc;
    }, {});

    // Xử lý nguyên liệu bị ghét và công thức bị hạn chế
    let restrictedRecipeIds = [];
    if (hateIngredients.length > 0) {
      const recipesWithHatedIngredients = await Recipe.find({
        "ingredients.ingredientId": { $in: hateIngredients },
      });
      restrictedRecipeIds = recipesWithHatedIngredients.map((recipe) => recipe._id.toString());
    }

    // Truy vấn món ăn với điều kiện
    const query = {
      isVisible: true,
      isDelete: false,
      _id: { $nin: restrictedFoods },
      $or: [{ recipeId: { $nin: restrictedRecipeIds } }, { recipeId: { $exists: false } }],
    };

    // Thêm điều kiện lọc theo type nếu có
    if (type) {
      query.type = type; // Lọc theo type của món ăn
    }

    // Thêm các ràng buộc dinh dưỡng
    if (nutritionalConstraints.carbs) query.carbs = { $lte: nutritionalConstraints.carbs };
    if (nutritionalConstraints.fat) query.fat = { $lte: nutritionalConstraints.fat };
    if (nutritionalConstraints.protein) query.protein = { $lte: nutritionalConstraints.protein };
    if (nutritionalConstraints.calories) query.calories = { $lte: nutritionalConstraints.calories };

    // Đếm tổng số items trước khi phân trang
    const totalItems = await Dish.countDocuments(query);

    const foryouItems = await Dish.find(query)
      .populate("recipeId")
      .populate("medicalConditionId")
      .skip(skip)
      .limit(limitNum);

    // Sắp xếp ưu tiên món ăn được khuyến nghị
    const sortedItems = foryouItems.sort((a, b) => {
      const aIsRecommended = recommendedFoods.includes(a._id.toString());
      const bIsRecommended = recommendedFoods.includes(b._id.toString());
      return bIsRecommended - aIsRecommended;
    });

    if (sortedItems.length === 0) {
      return {
        success: true,
        message: "Không tìm thấy món ăn nào khớp với tiêu chí",
        data: {
          items: [],
          totalItems: 0,
          currentPage: pageNum,
          totalPages: 0,
          itemsPerPage: limitNum,
        },
      };
    }

    return {
      success: true,
      message: "Danh sách món ăn được lấy thành công dựa trên điều kiện y tế và sở thích",
      data: {
        items: sortedItems,
        totalItems,
        currentPage: pageNum,
        totalPages: Math.ceil(totalItems / limitNum),
        itemsPerPage: limitNum,
      },
    };
  } catch (error) {
    console.error("Lỗi trong getForyou:", error);
    throw new Error(error.message);
  }
};
