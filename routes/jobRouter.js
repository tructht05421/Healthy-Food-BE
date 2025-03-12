const express = require("express");
const jobRouter = express.Router();
const { createJob } = require("../controllers/jobController");

// API tạo Job mới
jobRouter.post("/", createJob);

module.exports = jobRouter;
