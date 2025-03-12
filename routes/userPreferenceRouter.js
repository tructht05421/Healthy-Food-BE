const express = require("express");
const {
  getAllUserPreferences,
  getUserPreferenceById,
  updateUserPreference,
  softDeleteUserPreference,
  deleteUserPreference,
  searchUserPreferencesByName,
  filterUserPreferencesByDiet,
  getUserPreferenceByUserId,
  createUserPreference,
} = require("../controllers/userPreferenceController");
const userPreferenceRouter = express.Router();

// Create User Preference
userPreferenceRouter.post("/", createUserPreference);

// Get All User Preferences (not deleted)
userPreferenceRouter.get("/", getAllUserPreferences);

// Get User Preference by user_id
userPreferenceRouter.get("/:userId", getUserPreferenceByUserId);

// Update User Preference
userPreferenceRouter.put("/:id", updateUserPreference);

// Soft Delete User Preference
userPreferenceRouter.patch("/:id/soft-delete", softDeleteUserPreference);

// Permanently Delete User Preference
userPreferenceRouter.delete("/:id", deleteUserPreference);

// Search User Preferences by name
userPreferenceRouter.get("/search", searchUserPreferencesByName);

// Filter User Preferences by diet
userPreferenceRouter.get("/filter", filterUserPreferencesByDiet);

module.exports = userPreferenceRouter;
