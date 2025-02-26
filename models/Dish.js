const mongoose = require("mongoose");

const dishSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: null,
    },
    image_url: {
      type: String,
      default: null,
    },
    video_url: {
      type: String,
      default: null,
    },
    recipe_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recipe",
      required: false,
    },
    cooking_time: {
      type: String,
      required: false,
    },
    nutritions: {
      type: [String], // Array of nutrition information
      default: [],
    },
    flavor: {
      type: [String], // Array of flavors
      default: [],
    },
    type: {
      type: String,
      required: true,
    },
    season: {
      type: String,
      default: null,
    },
    isVisible: {
      type: Boolean,
      default: true, // Assuming it defaults to visible
    },
    isDelete: {
      type: Boolean,
      default: false, // Not deleted by default
    },
  },
  {
    timestamps: true, // Keeps track of created_at and updated_at automatically
  }
);

const Dish = mongoose.model("Dish", dishSchema);
module.exports = Dish;
