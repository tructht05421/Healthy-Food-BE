// medicalConditionController.js
const medicalConditionService = require("../services/medicalConditionService");

// Tạo Medical Condition
exports.createMedicalCondition = async (req, res) => {
  try {
    const newCondition = await medicalConditionService.createMedicalCondition(req.body);
    res.status(201).json({
      status: "success",
      data: newCondition,
    });
  } catch (error) {
    res.status(400).json({
      status: "fail",
      message: error.message,
    });
  }
};

// Lấy tất cả Medical Conditions
exports.getAllMedicalConditions = async (req, res) => {
  try {
    const result = await medicalConditionService.getAllMedicalConditions(req.query);
    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
};

// Lấy Medical Condition theo ID
exports.getMedicalConditionById = async (req, res) => {
  try {
    const condition = await medicalConditionService.getMedicalConditionById(req.params.conditionId);
    if (!condition) {
      return res.status(404).json({
        status: "fail",
        message: "Medical condition not found",
      });
    }
    res.status(200).json({
      status: "success",
      data: condition,
    });
  } catch (error) {
    res.status(400).json({
      status: "fail",
      message: error.message,
    });
  }
};

// Cập nhật Medical Condition
exports.updateMedicalCondition = async (req, res) => {
  try {
    const condition = await medicalConditionService.updateMedicalCondition(
      req.params.conditionId,
      req.body
    );
    if (!condition) {
      return res.status(404).json({
        status: "fail",
        message: "Medical condition not found",
      });
    }
    res.status(200).json({
      status: "success",
      data: condition,
    });
  } catch (error) {
    res.status(400).json({
      status: "fail",
      message: error.message,
    });
  }
};

// Xóa mềm Medical Condition
exports.deleteMedicalCondition = async (req, res) => {
  try {
    const result = await medicalConditionService.deleteMedicalCondition(req.params.conditionId);
    if (!result) {
      return res.status(404).json({
        status: "fail",
        message: "Medical condition not found",
      });
    }
    res.status(200).json({
      status: "success",
      message: "Medical condition has been soft deleted",
    });
  } catch (error) {
    res.status(400).json({
      status: "fail",
      message: error.message,
    });
  }
};

// Tìm kiếm Medical Condition theo tên
exports.searchMedicalConditionByName = async (req, res) => {
  try {
    const conditions = await medicalConditionService.searchMedicalConditionByName(req.query);
    res.status(200).json({
      status: "success",
      results: conditions.length,
      data: conditions,
    });
  } catch (error) {
    res.status(400).json({
      status: "fail",
      message: error.message,
    });
  }
};
