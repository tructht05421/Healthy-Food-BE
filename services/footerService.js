const jwt = require("jsonwebtoken");
const UserModel = require("../models/UserModel");
const FAQ = require("../models/footer/FAQs");
const AboutUs = require("../models/footer/About");
const ContactUs = require("../models/footer/Contact");
const TermOfUse = require("../models/footer/Term");

// === HELPER FUNCTIONS ===
const getPaginationParams = (req) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const sort = req.query.sort || "createdAt";
  const order = req.query.order || "desc";
  const sortOrder = order === "desc" ? -1 : 1;
  return { page, limit, skip, sortOptions: { [sort]: sortOrder } };
};

const getUserRoleFilter = async (req, defaultFilter) => {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
  let filter = defaultFilter;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      const user = await UserModel.findById(decoded.id);
      if (user && (user.role === "admin")) {
        filter = {}; // Admin/Nutritionist thấy tất cả
      }
    } catch (error) {
      console.error("Invalid token:", error.message);
    }
  }
  return filter;
};

// === FAQ SERVICES ===
exports.getAllFAQs = async (req) => {
  const { page, limit, skip, sortOptions } = getPaginationParams(req);
  const filter = await getUserRoleFilter(req, { isDeleted: false, isVisible: true });

  const totalFAQs = await FAQ.countDocuments(filter);
  const faqs = await FAQ.find(filter).sort(sortOptions).skip(skip).limit(limit);
  const totalPages = Math.ceil(totalFAQs / limit);

  return {
    status: "success",
    results: faqs.length,
    total: totalFAQs,
    totalPages,
    currentPage: page,
    data: { faqs },
  };
};

exports.createFAQ = async (body) => {
  const { category, question, answer } = body;
  if (!category || !question || !answer) {
    throw { status: 400, message: "Vui lòng nhập đầy đủ category, question và answer." };
  }
  const newFaq = await FAQ.create({ category, question, answer });
  return { status: "success", message: "Thêm FAQ thành công!", data: newFaq };
};

exports.updateFAQ = async (id, body) => {
  const updatedFaq = await FAQ.findByIdAndUpdate(id, body, { new: true, runValidators: true });
  if (!updatedFaq) throw { status: 404, message: "FAQ không tồn tại." };
  return { status: "success", message: "Cập nhật thành công!", data: updatedFaq };
};

exports.hardDeleteFAQ = async (id) => {
  await FAQ.findByIdAndDelete(id);
  return { status: "success", message: "FAQ đã bị xóa vĩnh viễn" };
};

// === AboutUs SERVICES ===
exports.getAllAboutUs = async (req) => {
  const { page, limit, skip, sortOptions } = getPaginationParams(req);
  const filter = await getUserRoleFilter(req, { isDeleted: false, isVisible: true });

  const totalAboutUs = await AboutUs.countDocuments(filter);
  const aboutUs = await AboutUs.find(filter).sort(sortOptions).skip(skip).limit(limit);
  const totalPages = Math.ceil(totalAboutUs / limit);

  return {
    status: "success",
    results: aboutUs.length,
    total: totalAboutUs,
    totalPages,
    currentPage: page,
    data: { aboutUs },
  };
};

exports.createAboutUs = async (body) => {
  const { bannerUrl, content } = body;
  if (!bannerUrl || !content) throw { status: 400, message: "Thiếu dữ liệu đầu vào!" };
  const newAboutUs = await AboutUs.create({ bannerUrl, content });
  return { status: "success", data: newAboutUs };
};

exports.updateAboutUs = async (id, body) => {
  const updatedAboutUs = await AboutUs.findByIdAndUpdate(id, body, { new: true });
  if (!updatedAboutUs) throw { status: 404, message: "About Us không tồn tại." };
  return { status: "success", data: updatedAboutUs };
};

exports.hardDeleteAboutUs = async (id) => {
  await AboutUs.findByIdAndDelete(id);
  return { status: "success", message: "About Us đã bị xóa vĩnh viễn" };
};

// === ContactUs SERVICES ===
exports.getAllContactUs = async (req) => {
  const { page, limit, skip, sortOptions } = getPaginationParams(req);
  const query = { isDeleted: false };

  const totalContacts = await ContactUs.countDocuments(query);
  const contactUs = await ContactUs.find(query).sort(sortOptions).skip(skip).limit(limit);
  const totalPages = Math.ceil(totalContacts / limit);

  return {
    status: "success",
    results: contactUs.length,
    total: totalContacts,
    totalPages,
    currentPage: page,
    data: { contactUs },
  };
};

exports.createContactUs = async (body) => {
  const { name, mail, subject, message } = body;
  if (!name || !mail || !subject || !message) {
    throw { status: 400, message: "Thiếu thông tin cần thiết" };
  }
  const newContactUs = await ContactUs.create(body);
  return { status: "success", data: newContactUs };
};

exports.updateContactUs = async (id, body) => {
  const updatedContact = await ContactUs.findByIdAndUpdate(id, body, {
    new: true,
    runValidators: true,
  });
  if (!updatedContact) throw { status: 404, message: "Contact không tồn tại." };
  return { status: "success", message: "Cập nhật thành công!", data: updatedContact };
};

exports.hardDeleteContactUs = async (id) => {
  const contact = await ContactUs.findById(id);
  if (!contact) throw { status: 404, message: "Contact không tồn tại!" };
  await ContactUs.findByIdAndDelete(id);
  return { status: "success", message: "Contact Us đã bị xóa vĩnh viễn" };
};

// === TermsOfUse SERVICES ===
exports.getAllTerms = async (req) => {
  const { page, limit, skip, sortOptions } = getPaginationParams(req);
  const filter = await getUserRoleFilter(req, { isDeleted: false, isVisible: true });

  const totalTerms = await TermOfUse.countDocuments(filter);
  const terms = await TermOfUse.find(filter)
    .select("_id bannerUrl content isVisible")
    .sort(sortOptions)
    .skip(skip)
    .limit(limit);
  const totalPages = Math.ceil(totalTerms / limit);

  return {
    success: true,
    results: terms.length,
    total: totalTerms,
    totalPages,
    currentPage: page,
    data: { terms },
  };
};

exports.createTerm = async (body) => {
  const { bannerUrl, content } = body;
  if (!bannerUrl || !content) throw { status: 400, message: "Thiếu dữ liệu đầu vào!" };
  const newTerm = await TermOfUse.create({ bannerUrl, content });
  return { success: true, data: newTerm };
};

exports.updateTerm = async (id, body) => {
  const updatedTerm = await TermOfUse.findByIdAndUpdate(id, body, { new: true });
  if (!updatedTerm) throw { status: 404, message: "Không tìm thấy Term" };
  return { success: true, data: updatedTerm };
};

exports.hardDeleteTerm = async (id) => {
  await TermOfUse.findByIdAndDelete(id);
  return { success: true, message: "Terms đã bị xóa vĩnh viễn" };
};
