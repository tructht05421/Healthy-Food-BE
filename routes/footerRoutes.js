const express = require("express");
const router = express.Router();
const { isAuthenticated, isAdmin, isNutritionist } = require("../middlewares/isAuthenticated");


// Import Controllers
const { getAllFAQs, createFAQ, updateFAQ, hardDeleteFAQ } = require("../controllers/footer/faqController");
const { getAllAboutUs, createAboutUs, updateAboutUs, hardDeleteAboutUs } = require("../controllers/footer/aboutController");
const { getAllContactUs, createContactUs, hardDeleteContactUs } = require("../controllers/footer/contactController");
const { getAllTerms, createTerm, updateTerm, hardDeleteTerm } = require("../controllers/footer/termController");

// APIs FAQs
router.get("/faqs", getAllFAQs);
router.post("/faqs", isAuthenticated, isAdmin, createFAQ);
router.put("/faqs/:id", isAuthenticated, isAdmin, updateFAQ);
router.delete("/faqs/hard/:id", isAuthenticated, isAdmin, hardDeleteFAQ); // Xóa cứng

// APIs AboutUs
router.get("/about", getAllAboutUs);
router.post("/about", isAuthenticated, isAdmin, createAboutUs);
router.put("/about/:id", isAuthenticated, isAdmin, updateAboutUs);
router.delete("/about/hard/:id",isAuthenticated, isAdmin, hardDeleteAboutUs); // Xóa cứng

// APIs ContactUs
router.get("/contact", getAllContactUs);
router.post("/contact", createContactUs);
// router.put("/contact/:id", updateContactUs);
router.delete("/contact/hard/:id",isAuthenticated, hardDeleteContactUs); // Xóa cứng

// APIs TermsOfUse
router.get("/terms", getAllTerms);
router.post("/terms",isAuthenticated, isAdmin, createTerm);
router.put("/terms/:id",isAuthenticated, isAdmin, updateTerm);
router.delete("/terms/hard/:id",isAuthenticated, isAdmin, hardDeleteTerm); // Xóa cứng

module.exports = router;
