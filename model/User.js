var mongoose = require("mongoose");

var userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please tell us your name!"],
      minlength: 3,
      maxlength: 32,
      trim: true,
    },
    mobile: {
      type: String,
      maxlength: 15,
      trim: true,
      unique: true,
    },
    email: {
      type: String,
      trim: true,
      required: [true, "Enter email!"],
      unique: true,
    },
    isStudent: {
      type: Boolean,
      required: [true, "Enter whether you are student or not"],
      default: true,
    },
    encry_password: {
      type: String,
      minlength: 6,
      required: [true, "Please Enter your password"],
    },
    paymentID: {
      type: String,
      default: "",
    },
    paid: {
      type: Boolean,
      default: false,
    },
    eventsEnrolled: {
      type: Array,
      default: [],
    },
    lastLogin: String,
    isVerified: {
      type: Number,
      default: 0,
    },
    userCode: {
      type: String,
      default: "0000",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TZ_user", userSchema);
