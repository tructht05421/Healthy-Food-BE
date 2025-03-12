const express = require("express");
const paymentRouter = express.Router();
const { createPaymentUrl, vnpayReturn } = require("../controllers/paymentController");

paymentRouter.post("/pay", createPaymentUrl);
paymentRouter.get("/return", vnpayReturn);

module.exports = paymentRouter;
