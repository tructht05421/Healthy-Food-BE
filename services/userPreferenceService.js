const mongoose = require("mongoose");
const UserModel = require("../models/UserModel");
const UserPreferenceModel = require("../models/UserPrefenrenceModel");

// Tạo mới User Preference
exports.createUserPreference = async (body) => {
  const {
    userId,
    age,
    diet,
    eatHabit,
    email,
    favorite,
    longOfPlan,
    mealNumber,
    name,
    goal,
    sleepTime,
    waterDrink,
    currentMealplanId,
    previousMealplanId,
    hate,
    recommendedFoods,
    weight,
    weightGoal,
    height,
    activityLevel,
    gender,
    phoneNumber,
    underDisease,
    theme,
    isDelete,
  } = body;

  // Kiểm tra các trường bắt buộc
  if (!email || !name || !userId) {
    return {
      success: false,
      message: "Thiếu các trường bắt buộc: email, name, userId!",
    };
  }

  // Kiểm tra userId có hợp lệ không
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return {
      success: false,
      message: "userId không hợp lệ!",
    };
  }

  // Kiểm tra userId có tồn tại trong UserModel không
  const userExists = await UserModel.findById(userId);
  if (!userExists) {
    return {
      success: false,
      message: "Không tìm thấy người dùng với userId này!",
    };
  }

  // Kiểm tra định dạng email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      success: false,
      message: "Email không hợp lệ!",
    };
  }

  // Tạo user preference mới
  const newUserPreference = new UserPreferenceModel({
    userId,
    age,
    diet,
    eatHabit,
    email,
    favorite,
    longOfPlan,
    mealNumber,
    name,
    goal,
    sleepTime,
    waterDrink,
    currentMealplanId,
    previousMealplanId,
    hate,
    recommendedFoods,
    weight,
    weightGoal,
    height,
    activityLevel,
    gender,
    phoneNumber,
    underDisease,
    theme,
    isDelete: isDelete || false,
  });

  await newUserPreference.save();

  // Cập nhật userPreferenceId trong UserModel
  const updatedUser = await UserModel.findByIdAndUpdate(
    userId,
    { userPreferenceId: newUserPreference._id },
    { new: true }
  );

  if (!updatedUser) {
    return {
      success: false,
      message: "Không tìm thấy người dùng để cập nhật userPreferenceId!",
    };
  }

  return {
    success: true,
    message: "Sở thích người dùng đã được tạo và liên kết với người dùng!",
    data: {
      userPreference: newUserPreference,
      user: updatedUser,
    },
  };
};

// Lấy tất cả User Preferences (không bị xóa)
exports.getAllUserPreferences = async (query) => {
  const { page = 1, limit = 10 } = query;
  const preferences = await UserPreferenceModel.find({ isDelete: false })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));
  const total = await UserPreferenceModel.countDocuments({ isDelete: false });

  return {
    success: true,
    message: "Lấy danh sách sở thích người dùng thành công!",
    data: preferences,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Lấy User Preference theo ID
exports.getUserPreferenceById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return {
      success: false,
      message: "ID không hợp lệ!",
    };
  }

  const preference = await UserPreferenceModel.findById(id);
  if (!preference || preference.isDelete) {
    return {
      success: false,
      message: "Không tìm thấy sở thích người dùng!",
    };
  }

  return {
    success: true,
    message: "Lấy sở thích người dùng thành công!",
    data: preference,
  };
};

// Lấy User Preference theo userId
exports.getUserPreferenceByUserId = async (userId) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return {
      success: false,
      message: "userId không hợp lệ!",
    };
  }

  const preference = await UserPreferenceModel.findOne({
    userId,
    isDelete: false,
  });

  if (!preference) {
    return {
      success: false,
      message: "Không tìm thấy sở thích người dùng!",
    };
  }

  return {
    success: true,
    message: "Lấy sở thích người dùng theo userId thành công!",
    data: preference,
  };
};

// Cập nhật User Preference
exports.updateUserPreference = async (userPreferenceId, body) => {
  const updatedPreference = await UserPreferenceModel.findOneAndUpdate(
    { _id: userPreferenceId, isDelete: false },
    body,
    { new: true }
  );

  if (!updatedPreference) {
    return {
      status: "fail",
      message: "User Preference not found",
    };
  }

  return {
    success: true,
    message: "Cập nhật sở thích người dùng thành công!",
    data: updatedPreference,
  };
};

// Xóa mềm User Preference
exports.softDeleteUserPreference = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return {
      success: false,
      message: "ID không hợp lệ!",
    };
  }

  const preference = await UserPreferenceModel.findByIdAndUpdate(
    id,
    { isDelete: true },
    { new: true }
  );
  if (!preference) {
    return {
      success: false,
      message: "Không tìm thấy sở thích người dùng!",
    };
  }

  return {
    success: true,
    message: "Sở thích người dùng đã được xóa mềm thành công!",
  };
};

// Xóa vĩnh viễn User Preference
exports.deleteUserPreference = async (id) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return {
        success: false,
        message: "Invalid ID!",
      };
    }

    const deletedPreference = await UserPreferenceModel.findByIdAndDelete(id);
    if (!deletedPreference) {
      return {
        success: false,
        message: "User Preference not found!",
      };
    }

    await UserModel.findOneAndUpdate({ userPreferenceId: id }, { userPreferenceId: null });

    return {
      success: true,
      message:
        "User Preference has been permanently deleted and userPreferenceId has been removed!",
    };
  } catch (error) {
    console.error("Error deleting user preference:", error);
    return {
      success: false,
      message: "Server error: " + error.message,
    };
  }
};

// Tìm kiếm User Preferences theo tên
exports.searchUserPreferencesByName = async (query) => {
  const { name, page = 1, limit = 10 } = query;
  if (!name) {
    return {
      success: false,
      message: "Tham số name là bắt buộc!",
    };
  }

  const preferences = await UserPreferenceModel.find({
    name: { $regex: name, $options: "i" },
    isDelete: false,
  })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await UserPreferenceModel.countDocuments({
    name: { $regex: name, $options: "i" },
    isDelete: false,
  });

  return {
    success: true,
    message: "Tìm kiếm sở thích người dùng thành công!",
    data: preferences,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Lọc User Preferences theo chế độ ăn (diet)
exports.filterUserPreferencesByDiet = async (query) => {
  const { diet, page = 1, limit = 10 } = query;
  if (!diet) {
    return {
      success: false,
      message: "Tham số diet là bắt buộc!",
    };
  }

  const preferences = await UserPreferenceModel.find({
    diet: diet,
    isDelete: false,
  })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await UserPreferenceModel.countDocuments({
    diet: diet,
    isDelete: false,
  });

  return {
    success: true,
    message: "Lọc sở thích người dùng theo chế độ ăn thành công!",
    data: preferences,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Reset User Preference
exports.resetUserPreference = async (userPreferenceId) => {
  try {
    // Kiểm tra xem userPreference có tồn tại không
    const existingPreference = await UserPreferenceModel.findOne({
      _id: userPreferenceId,
      isDelete: false,
    });

    if (!existingPreference) {
      return {
        status: "fail",
        message: "User Preference not found",
      };
    }

    // Xóa UserPreference
    await UserPreferenceModel.findByIdAndDelete(userPreferenceId);

    // Cập nhật UserModel để xóa userPreferenceId
    await UserModel.findOneAndUpdate(
      { userPreferenceId: userPreferenceId },
      { $unset: { userPreferenceId: "" } }
    );

    return {
      status: "success",
      message:
        "The user ownership has been permanently deleted and the userPreferenceId has been deleted!",
    };
  } catch (error) {
    console.error("Error resetting user preference:", error);
    return {
      status: "error",
      message: "An error occurred while resetting user preference",
    };
  }
};
