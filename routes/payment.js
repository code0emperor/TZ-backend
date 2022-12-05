const express = require("express");
const { checkout, paymentVerification, addTransaction, manualPaymentVerification, getAllTransactions } = require("../controller/payment.js");

const router = express.Router();

router.route("/checkout").post(checkout);

router.route("/paymentverification").post(paymentVerification);

module.exports = router;
