const mongoose = require("mongoose");

const aboutSchema = new mongoose.Schema(
  {
    bannerUrl: { type: String, required: true },
    content: { type: String, required: true },
    isVisible: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AboutUs", aboutSchema);
