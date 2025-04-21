const VNPAY_CONFIG = {
  vnp_TmnCode: process.env.VNPAY_TMN_CODE || "3EUVFAZ3",
  vnp_HashSecret: process.env.VNPAY_HASH_SECRET || "AAN73FT2ZNAD9T5D88HUN0OTR6NEYDTH",
  vnp_Url: process.env.VNPAY_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
  vnp_ReturnUrl_Web:
    process.env.VNPAY_RETURN_URL_WEB || "http://localhost:8080/api/v1/payment/vnpay/return", // Dành cho web
  vnp_ReturnUrl_App:
    process.env.VNPAY_RETURN_URL_APP || "http://localhost:8080/api/v1/payment/vnpay/app/return", // Dành cho app
  vnp_Api: process.env.VNPAY_API || "https://sandbox.vnpayment.vn/merchant_webapi/api/transaction",
  vnp_AdminReturnUrl:
    process.env.VNPAY_ADMIN_RETURN_URL || "http://localhost:8080/api/v1/payment/vnpay/adminReturn",
};

module.exports = VNPAY_CONFIG;
