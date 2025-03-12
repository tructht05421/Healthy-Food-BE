const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    mail: { type: String, required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    isDeleted: { type: Boolean, default: false }, //
  },
  { timestamps: true }
); //

module.exports = mongoose.model("ContactUs", contactSchema);
