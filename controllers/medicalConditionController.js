const MedicalCondition = require("../models/MedicalCondition");

// Tạo Medical Condition
exports.createMedicalCondition = async (req, res) => {
  try {
    const newCondition = new MedicalCondition(req.body);
    await newCondition.save();
    res.status(201).json({ status: "success", data: newCondition });
  } catch (error) {
    res.status(400).json({ status: "fail", message: error.message });
  }
};

// Lấy tất cả Medical Conditions (chỉ lấy những cái chưa bị xóa mềm)
exports.getAllMedicalConditions = async (req, res) => {
  try {
    const conditions = await MedicalCondition.find({ isDelete: false });
    res.status(200).json({ status: "success", data: conditions });
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
};

// Lấy một Medical Condition theo ID
exports.getMedicalConditionById = async (req, res) => {
  try {
    const condition = await MedicalCondition.findById(req.params.conditionId);
    if (!condition || condition.isDelete) {
      return res.status(404).json({ status: "fail", message: "Medical condition not found" });
    }
    res.status(200).json({ status: "success", data: condition });
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
};

// Cập nhật Medical Condition
exports.updateMedicalCondition = async (req, res) => {
  try {
    const updatedCondition = await MedicalCondition.findByIdAndUpdate(
      req.params.conditionId,
      req.body,
      { new: true }
    );
    if (!updatedCondition) {
      return res.status(404).json({ status: "fail", message: "Medical condition not found" });
    }
    res.status(200).json({ status: "success", data: updatedCondition });
  } catch (error) {
    res.status(400).json({ status: "fail", message: error.message });
  }
};

// Xóa Medical Condition
exports.deleteMedicalCondition = async (req, res) => {
    try {
      const deletedCondition = await MedicalCondition.findByIdAndDelete(req.params.conditionId);
      if (!deletedCondition) {
        return res.status(404).json({ status: "fail", message: "Medical condition not found" });
      }
      res.status(200).json({ status: "success", message: "Medical condition permanently deleted" });
    } catch (error) {
      res.status(500).json({ status: "fail", message: error.message });
    }
  };


// Tìm kiếm Medical Condition theo tên
exports.searchMedicalConditionByName = async (req, res) => {
  try {
    const { name } = req.query;
    if (!name) {
      return res.status(400).json({ status: "fail", message: "Name query parameter is required" });
    }

    const conditions = await MedicalCondition.find({
      name: { $regex: name, $options: "i" },
      isDelete: false,
    });

    if (conditions.length === 0) {
      return res.status(404).json({ status: "fail", message: "No medical conditions found" });
    }

    res.status(200).json({ status: "success", data: conditions });
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
};
