const express = require("express");
const route = express.Router();

const { addTransaction, manualPaymentVerification, getAllTransactions } = require("../controller/payment.js");

// MIDDLEWARE
const {
  isSignedIn,
} = require("../middleware/auth");

route.post("/addTransaction",isSignedIn, addTransaction);

route.post("/manualPaymentVerification", manualPaymentVerification);

route.get("/getAllTransactions", getAllTransactions);

module.exports = route;
