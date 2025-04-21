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

// Get User Preference by ID
userPreferenceRouter.get("/:id", getUserPreferenceById);

// Get User Preference by userId
userPreferenceRouter.get("/user/:userId", getUserPreferenceByUserId);

// Update User Preference
userPreferenceRouter.put("/:userPreferenceId", updateUserPreference); // Đổi :id thành :userPreferenceId

// Soft Delete User Preference
userPreferenceRouter.patch("/:id/soft-delete", softDeleteUserPreference);

// Permanently Delete User Preference
userPreferenceRouter.delete("/:id", deleteUserPreference);

// Search User Preferences by name
userPreferenceRouter.get("/search", searchUserPreferencesByName);

// Filter User Preferences by diet
userPreferenceRouter.get("/filter", filterUserPreferencesByDiet);

module.exports = userPreferenceRouter;
