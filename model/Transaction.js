const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    transactionId: {
      type: Array,
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
      default: "Success",
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
