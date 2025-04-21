const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    mail: { type: String, required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    isResolved: { type: Boolean, default: false }, // Thêm trường này
    isDeleted: { type: Boolean, default: false }, //
  },
  { timestamps: true }
); //

module.exports = mongoose.model("ContactUs", contactSchema);
