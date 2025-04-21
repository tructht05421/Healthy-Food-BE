const userPreferenceService = require("../services/userPreferenceService");

// Tạo mới User Preference
exports.createUserPreference = async (req, res) => {
  try {
    const result = await userPreferenceService.createUserPreference(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server: " + error.message,
    });
  }
};

// Lấy tất cả User Preferences (không bị xóa)
exports.getAllUserPreferences = async (req, res) => {
  try {
    const result = await userPreferenceService.getAllUserPreferences(req.query);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server: " + error.message,
    });
  }
};

// Lấy User Preference theo ID
exports.getUserPreferenceById = async (req, res) => {
  try {
    const result = await userPreferenceService.getUserPreferenceById(req.params.id);
    if (!result.success) {
      return res.status(404).json(result); // Trả về lỗi 404 nếu không tìm thấy
    }
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server: " + error.message,
    });
  }
};

// Lấy User Preference theo userId
exports.getUserPreferenceByUserId = async (req, res) => {
  try {
    const result = await userPreferenceService.getUserPreferenceByUserId(req.params.userId);
    if (!result.success) {
      return res.status(404).json(result); // Trả về lỗi 404 nếu không tìm thấy
    }
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server: " + error.message,
    });
  }
};

// Cập nhật User Preference
exports.updateUserPreference = async (req, res) => {
  try {
    const result = await userPreferenceService.updateUserPreference(
      req.params.userPreferenceId,
      req.body
    );
    if (!result.success) {
      return res.status(404).json(result); // Trả về lỗi 404 nếu không tìm thấy
    }
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server: " + error.message,
    });
  }
};

// Xóa mềm User Preference
exports.softDeleteUserPreference = async (req, res) => {
  try {
    const result = await userPreferenceService.softDeleteUserPreference(req.params.id);
    if (!result.success) {
      return res.status(404).json(result); // Trả về lỗi 404 nếu không tìm thấy
    }
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server: " + error.message,
    });
  }
};

// Xóa vĩnh viễn User Preference
exports.deleteUserPreference = async (req, res) => {
  try {
    const result = await userPreferenceService.deleteUserPreference(req.params.id);
    if (result.status === "fail") {
      return res.status(404).json({
        success: false,
        message: result.message,
      });
    }
    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error Server: " + error.message,
    });
  }
};

// Tìm kiếm User Preferences theo tên
exports.searchUserPreferencesByName = async (req, res) => {
  try {
    const result = await userPreferenceService.searchUserPreferencesByName(req.query);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server: " + error.message,
    });
  }
};

// Lọc User Preferences theo chế độ ăn (diet)
exports.filterUserPreferencesByDiet = async (req, res) => {
  try {
    const result = await userPreferenceService.filterUserPreferencesByDiet(req.query);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server: " + error.message,
    });
  }
};

// Reset User Preference
exports.resetUserPreference = async (req, res) => {
  try {
    const result = await userPreferenceService.resetUserPreference(req.params.userPreferenceId);
    if (!result.success) {
      return res.status(404).json(result); // Trả về lỗi 404 nếu không tìm thấy
    }
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
};
