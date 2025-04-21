const catchAsync = require("../utils/catchAsync");
const footerService = require("../services/footerService");

// === FAQs CONTROLLERS ===
exports.getAllFAQs = catchAsync(async (req, res, next) => {
  const result = await footerService.getAllFAQs(req);
  res.status(200).json(result);
});

exports.createFAQ = catchAsync(async (req, res, next) => {
  const result = await footerService.createFAQ(req.body);
  res.status(201).json(result);
});

exports.updateFAQ = catchAsync(async (req, res, next) => {
  const result = await footerService.updateFAQ(req.params.id, req.body);
  res.status(200).json(result);
});

exports.hardDeleteFAQ = catchAsync(async (req, res, next) => {
  const result = await footerService.hardDeleteFAQ(req.params.id);
  res.status(200).json(result);
});

// === AboutUs CONTROLLERS ===
exports.getAllAboutUs = catchAsync(async (req, res, next) => {
  const result = await footerService.getAllAboutUs(req);
  res.status(200).json(result);
});

exports.createAboutUs = catchAsync(async (req, res, next) => {
  const result = await footerService.createAboutUs(req.body);
  res.status(201).json(result);
});

exports.updateAboutUs = catchAsync(async (req, res, next) => {
  const result = await footerService.updateAboutUs(req.params.id, req.body);
  res.status(200).json(result);
});

exports.hardDeleteAboutUs = catchAsync(async (req, res, next) => {
  const result = await footerService.hardDeleteAboutUs(req.params.id);
  res.status(200).json(result);
});

// === ContactUs CONTROLLERS ===
exports.getAllContactUs = catchAsync(async (req, res, next) => {
  const result = await footerService.getAllContactUs(req);
  res.status(200).json(result);
});

exports.createContactUs = catchAsync(async (req, res, next) => {
  const result = await footerService.createContactUs(req.body);
  res.status(201).json(result);
});

exports.updateContactUs = catchAsync(async (req, res, next) => {
  const result = await footerService.updateContactUs(req.params.id, req.body);
  res.status(200).json(result);
});

exports.hardDeleteContactUs = catchAsync(async (req, res, next) => {
  const result = await footerService.hardDeleteContactUs(req.params.id);
  res.status(200).json(result);
});

// === TermsOfUse CONTROLLERS ===
exports.getAllTerms = catchAsync(async (req, res, next) => {
  const result = await footerService.getAllTerms(req);
  res.status(200).json(result);
});

exports.createTerm = catchAsync(async (req, res, next) => {
  const result = await footerService.createTerm(req.body);
  res.status(201).json(result);
});

exports.updateTerm = catchAsync(async (req, res, next) => {
  const result = await footerService.updateTerm(req.params.id, req.body);
  res.status(200).json(result);
});

exports.hardDeleteTerm = catchAsync(async (req, res, next) => {
  const result = await footerService.hardDeleteTerm(req.params.id);
  res.status(200).json(result);
});
