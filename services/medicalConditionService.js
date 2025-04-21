// medicalConditionService.js
const MedicalCondition = require("../models/MedicalCondition");

// Tạo Medical Condition
exports.createMedicalCondition = async (data) => {
  const existingCondition = await MedicalCondition.findOne({ 
    name: data.name, 
    isDelete: false 
  });
  if (existingCondition) {
    throw Object.assign(new Error("Medical condition with this name already exists"), { status: 400 });
  }
  const newCondition = new MedicalCondition(data);
  await newCondition.save();
  return newCondition;
};

// Lấy tất cả Medical Conditions
exports.getAllMedicalConditions = async (query) => {
  const { page = 1, limit = 10, search = "", sort = "createdAt", order = "desc" } = query;

  // Tạo bộ lọc tìm kiếm
  let filter = { isDelete: false };
  if (search) {
    filter.name = { $regex: search, $options: "i" };
  }

  // Xử lý phân trang
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  // Xử lý sắp xếp
  const sortOrder = order === "desc" ? -1 : 1;
  const sortOptions = { [sort]: sortOrder };

  // Lấy tổng số điều kiện y tế
  const totalItems = await MedicalCondition.countDocuments(filter);

  // Lấy danh sách bệnh lý
  const conditions = await MedicalCondition.find(filter)
    .populate("restrictedFoods")
    .populate("recommendedFoods")
    .sort(sortOptions)
    .skip(skip)
    .limit(limitNum)
    .lean();

  return {
    items: conditions,
    total: totalItems,
    currentPage: pageNum,
    totalPages: Math.ceil(totalItems / limitNum),
  };
};

// Lấy Medical Condition theo ID
exports.getMedicalConditionById = async (conditionId) => {
  const condition = await MedicalCondition.findOne({
    _id: conditionId,
    isDelete: false,
  })
    .populate("restrictedFoods")
    .populate("recommendedFoods");

  return condition;
};

// Cập nhật Medical Condition
exports.updateMedicalCondition = async (conditionId, data) => {
  const condition = await MedicalCondition.findOneAndUpdate(
    { _id: conditionId, isDelete: false },
    data,
    { new: true, runValidators: true }
  )
    .populate("restrictedFoods")
    .populate("recommendedFoods");

  return condition;
};

// Xóa mềm Medical Condition
exports.deleteMedicalCondition = async (conditionId) => {
  const condition = await MedicalCondition.findOneAndUpdate(
    { _id: conditionId, isDelete: false },
    { isDelete: true },
    { new: true }
  );

  return condition;
};

// Tìm kiếm Medical Condition theo tên
exports.searchMedicalConditionByName = async (query) => {
  const { name } = query;
  const conditions = await MedicalCondition.find({
    name: { $regex: name, $options: "i" },
    isDelete: false,
  })
    .populate("restrictedFoods")
    .populate("recommendedFoods");

  return conditions;
};
