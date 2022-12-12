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
  },
  { timestamps: true }
);

exports.Transaction = mongoose.model("Transaction", transactionSchema);
