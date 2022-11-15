const Razorpay = require("razorpay");
const dotenv = require("dotenv");
dotenv.config({
  path: "./config/config.env",
});
exports.instance = new Razorpay({
  key_id: process.env.RAZORPAY_API_KEY,
  key_secret: process.env.RAZORPAY_APT_SECRET,
});
