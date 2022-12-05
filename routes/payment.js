const express = require("express");
const { checkout, paymentVerification, addTransaction, manualPaymentVerification, getAllTransactions } = require("../controller/payment.js");

const router = express.Router();

router.route("/checkout").post(checkout);

router.route("/paymentverification").post(paymentVerification);

router.route("/addTransaction").post(addTransaction);

router.route("/manualPaymentVerification").post(manualPaymentVerification);

router.route("/getAllTransactions").get(getAllTransactions);

module.exports = router;
