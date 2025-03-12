const mongoose = require("mongoose");

const faqSchema = new mongoose.Schema(
  {
    category: { type: String, required: true },
    question: { type: String, required: true },
    answer: { type: String, required: true },
    isVisible: { type: Boolean, default: true },

    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FAQs", faqSchema);
