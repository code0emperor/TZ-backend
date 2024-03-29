const express = require("express");
const route = express.Router();


// MIDDLEWARE
const {
  isSignedIn, isTreasury,
} = require("../middleware/auth");

const {
  addTransaction,
  manualPaymentVerification,
  getAllTransactions,
  checkStatus,
  getTransactions,
  addReferralCodes
} = require("../controller/payment.js");


route.post("/addTransaction", isSignedIn, addTransaction);

route.post("/manualPaymentVerification", isSignedIn, isTreasury, manualPaymentVerification);

route.get("/CheckVerificationStatus", checkStatus);

route.post("/getAllTransactions", isSignedIn, isTreasury, getAllTransactions);

route.post("/getTransactions", isSignedIn, getTransactions);

// route.post("/addReferralCodes", addReferralCodes);

module.exports = route;
