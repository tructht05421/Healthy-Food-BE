const express = require("express");
const footerRouter = express.Router();
const { isAuthenticated, isAdmin, isNutritionist } = require("../middlewares/isAuthenticated");
const {
  getAllFAQs,
  createFAQ,
  updateFAQ,
  hardDeleteFAQ,
  getAllAboutUs,
  createAboutUs,
  updateAboutUs,
  hardDeleteAboutUs,
  getAllContactUs,
  createContactUs,
  updateContactUs,
  hardDeleteContactUs,
  getAllTerms,
  createTerm,
  updateTerm,
  hardDeleteTerm,
} = require("../controllers/footerController");

// APIs FAQs
footerRouter.get("/faqs", getAllFAQs);
footerRouter.post("/faqs", isAuthenticated, isAdmin, createFAQ);
footerRouter.put("/faqs/:id", isAuthenticated, isAdmin, updateFAQ);
footerRouter.delete("/faqs/hard/:id", isAuthenticated, isAdmin, hardDeleteFAQ);

// APIs AboutUs
footerRouter.get("/about", getAllAboutUs);
footerRouter.post("/about", isAuthenticated, isAdmin, createAboutUs);
footerRouter.put("/about/:id", isAuthenticated, isAdmin, updateAboutUs);
footerRouter.delete("/about/hard/:id", isAuthenticated, isAdmin, hardDeleteAboutUs);

// APIs ContactUs
footerRouter.get("/contact", getAllContactUs);
footerRouter.post("/contact", isAuthenticated, createContactUs);
footerRouter.put("/contact/:id", isAuthenticated, isAdmin, updateContactUs);
footerRouter.delete("/contact/hard/:id", isAuthenticated, isAdmin, hardDeleteContactUs);

// APIs TermsOfUse
footerRouter.get("/terms", getAllTerms);
footerRouter.post("/terms", isAuthenticated, isAdmin, createTerm);
footerRouter.put("/terms/:id", isAuthenticated, isAdmin, updateTerm);
footerRouter.delete("/terms/hard/:id", isAuthenticated, isAdmin, hardDeleteTerm);

module.exports = footerRouter;
