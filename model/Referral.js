const mongoose = require("mongoose");

const referralSchema = new mongoose.Schema({
    referralId: {
      type: String,
      required: true,
      unique: true
    },
    subCoreName: {
      type: String,
      required: true,
    },
    Department: {
        type: String,
        required: true,
    },
    Contact: {
        type: String,
        required: true,
    },
    referralCount: {
        type: Number,
        default: 0
    }
  },
  { timestamps: true }
);

exports.Referrals = mongoose.model("Referrals", referralSchema);