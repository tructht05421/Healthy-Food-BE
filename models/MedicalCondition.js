const mongoose = require("mongoose");

const MedicalConditionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    restrictedFoods: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Dish",
      },
    ],
    recommendedFoods: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Dish",
      },
    ],
    nutritionalConstraints: {
      carbs: { type: Number, default: null }, // Giới hạn carbs tối đa
      fat: { type: Number, default: null }, // Giới hạn fat tối đa
      protein: { type: Number, default: null }, // Có thể thêm nếu cần
      calories: { type: Number, default: null }, // Có thể thêm nếu cần
    },
    isDelete: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MedicalCondition", MedicalConditionSchema);
