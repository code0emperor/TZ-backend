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

route.get("/getAllTransactions", getAllTransactions);

// route.post("/addReferralCodes", addReferralCodes)

route.get("/getTransactions", isSignedIn, getTransactions);

module.exports = route;
