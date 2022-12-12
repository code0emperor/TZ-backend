const express = require("express");
const route = express.Router();

const {
  addTransaction,
  manualPaymentVerification,
  getAllTransactions,
  checkStatus,
  getTransactions,
} = require("../controller/payment.js");

// MIDDLEWARE
const { isSignedIn } = require("../middleware/auth");

route.post("/addTransaction", isSignedIn, addTransaction);

route.post("/manualPaymentVerification", manualPaymentVerification);

route.get("/CheckVerificationStatus", checkStatus);

route.get("/getAllTransactions", getAllTransactions);

route.get("/getTransactions", isSignedIn, getTransactions);

module.exports = route;
