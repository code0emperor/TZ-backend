const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: String,
      required: true,
    },
    userName: {
      type: String,
      default: ''
    },
    verified: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      default: "Pending",
      required: true,
    },
    formDates: {
      type: String,
      default: "000",
    },
    amount: {
      type: Number,
      required: true,
    },
    referredBy:{
      type: String,
      default: '',
      required: false,
    },
    verificationStatus:{
      type: Number,   // 0 - pending, 1 - success, 2 - reject
      default: 0,
    }
  },
  { timestamps: true }
);

exports.Transaction = mongoose.model("Transaction", transactionSchema);
