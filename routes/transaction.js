const express = require("express");
const route = express.Router();

const { addTransaction, manualPaymentVerification, getAllTransactions, addReferralCodes } = require("../controller/payment.js");

// MIDDLEWARE
const {
  isSignedIn, isTreasury,
} = require("../middleware/auth");

route.post("/addTransaction", isSignedIn, addTransaction);

route.post("/manualPaymentVerification", isSignedIn, isTreasury, manualPaymentVerification);

route.get("/getAllTransactions", getAllTransactions);

// route.post("/addReferralCodes", addReferralCodes)

module.exports = route;
