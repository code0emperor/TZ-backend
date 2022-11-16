const crypto = require("crypto");
const { Payment } = require("../model/Payment.js");
const User = require("../model/User.js");
const { instance } = require("../razorpay_instance.js");

exports.checkout = async (req, res) => {
  const options = {
    amount: Number(300 * 100),
    // notes : {"name" : req.body.name,"email":req.body.email,"phone":req.body.mobile},
    currency: "INR",
  };
  const order = await instance.orders.create(options);
  // console.log(order);
  res.status(200).json({
    success: true,
    order,
  });
};

exports.paymentVerification = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, user_id} =
    req.body;
  const id = user_id;
  //  console.log(req.body);

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_APT_SECRET)
    .update(body.toString())
    .digest("hex");

  const isAuthentic = expectedSignature === razorpay_signature;

  if (isAuthentic) {
    // Database comes here
    await Payment.create({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    User.findById(id, (err, user) => {
      if (!user || err)
        return res
          .status(300)
          .json({ message: "No user found", success: false });
      user.paid = true;
      user.save();
    });

    res.status(200).json({
      success: true,
      message: "payment successfully",
      payment_id: razorpay_payment_id,
    });
    // res.redirect(
    //   `http://localhost:3333/paymentsuccess?reference=${razorpay_payment_id}`
    //   // /paymentsuccess?reference=${razorpay_payment_id}
    // );
  } else {
    res.status(400).json({
      success: false,
    });
  }
};