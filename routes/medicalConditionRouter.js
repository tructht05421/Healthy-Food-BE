// medicalConditionRouter.js
const express = require("express");
const medicalConditionRouter = express.Router();
const {
  isAuthenticated,
  isNutritionist,
} = require("../middlewares/isAuthenticated");

const {
  createMedicalCondition,
  updateMedicalCondition,
  getMedicalConditionById,
  getAllMedicalConditions,
  deleteMedicalCondition,
  searchMedicalConditionByName,
} = require("../controllers/medicalConditionController");

// Public routes
medicalConditionRouter.get("/", getAllMedicalConditions);
medicalConditionRouter.get("/search", searchMedicalConditionByName);
medicalConditionRouter.get("/:conditionId", getMedicalConditionById);

// Protected routes (yêu cầu authentication và role nutritionist)
medicalConditionRouter.post(
  "/",
  isAuthenticated,
  isNutritionist,
  createMedicalCondition
);

medicalConditionRouter.put(
  "/:conditionId",
  isAuthenticated,
  isNutritionist,
  updateMedicalCondition
);

medicalConditionRouter.delete(
  "/:conditionId",
  isAuthenticated,
  isNutritionist,
  deleteMedicalCondition
);

module.exports = medicalConditionRouter;
