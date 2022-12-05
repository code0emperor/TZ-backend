const crypto = require("crypto");
const { Payment } = require("../model/Payment.js");
const { Transaction } = require("../model/Transaction.js");
const User = require("../model/User.js");
const { instance } = require("../razorpay_instance.js");

exports.checkout = async (req, res) => {
  const options = {
    amount: Number(3 * 100),
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
      user.paymentID = razorpay_payment_id;
      user.save();
    });

    res.status(200).json({
      success: true,
      message: "payment successfully"
    });
    // res.redirect(
    //   `http://localhost:3333/paymentsuccess?reference=${razorpay_payment_id}`
    //   // /paymentsuccess?reference=${razorpay_payment_id}
    // );
  } else {
    res.status(400).json({
      success: false,
      message: "Payment failed"
    });
  }
};

exports.addTransaction = (req, res) => {
  const { transactionId, amount, status } = req.body;
  const userId = req.body.userId || req.auth?.user?._id;
  const body = {
    transactionId: transactionId,
    userId: userId,
    verified: false,
    status: status,
    amount: amount,
  }
  console.log(body);
  // return res.json(body)
  const transaction = Transaction(body);
  transaction.save((err, trn) => {
    if (err) {
      return res.status(400).json({
        err: err.message,
      });
    }
    res.status(200).json({
      message: "Success",
      trnId: trn._id,
      ...body
    });
  })
}

exports.manualPaymentVerification = (req, res) => {
  const { transactionId } = req.body;

  Transaction.findOne({transactionId: transactionId}, (err, trn) => {
    if(err)
    {
      return res.status(400).json({
        err: err.message,
      });
    }
    trn.verified = true;
    trn.save();

    User.findById(trn.userId, (err, user) => {
      if(err)
      {
        return res.status(400).json({
          err: err.message,
        });
      }
      user.paid = true;
      user.save();
      return res.status(200).json({
        message: "Verified",
      })
    })
  })
}

exports.getAllTransactions = (req, res) => {
  Transaction.find().then((trn) => {
    return res.status(200).json(trn);
  })
}