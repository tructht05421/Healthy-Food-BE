const mongoose = require("mongoose");

const termSchema = new mongoose.Schema(
  {
    bannerUrl: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
    isVisible: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TermOfUse", termSchema);
