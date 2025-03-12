const VNPAY_CONFIG = {
  vnp_TmnCode: "3EUVFAZ3", // Mã website Merchant nhận từ VNPAY
  vnp_HashSecret: "AAN73FT2ZNAD9T5D88HUN0OTR6NEYDTH", // Chuỗi ký bí mật
  vnp_Url: "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html", // URL cổng thanh toán
  vnp_ReturnUrl: "http://localhost:8080/api/v1/vnpay/return", // URL callback sau khi thanh toán
  vnp_Api: "https://sandbox.vnpayment.vn/merchant_webapi/api/transaction", // API tra cứu giao dịch
};

module.exports = VNPAY_CONFIG;
