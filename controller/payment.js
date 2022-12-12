const crypto = require("crypto");
const { Payment } = require("../model/Payment.js");
const { Referrals } = require("../model/Referral.js");
const { Transaction } = require("../model/Transaction.js");
const User = require("../model/User.js");
const { instance } = require("../razorpay_instance.js");

/**
 * Enums for Payment status
 *
 * If user gets a pending payment then we will store their ifnormations
 */
const PAYMENT_SUCCESS = 1;
const PAYMENT_FAILURE = 0;

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
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    user_id,
  } = req.body;
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
      message: "payment successfully",
    });
    // res.redirect(
    //   `http://localhost:3333/paymentsuccess?reference=${razorpay_payment_id}`
    //   // /paymentsuccess?reference=${razorpay_payment_id}
    // );
  } else {
    res.status(400).json({
      success: false,
      message: "Payment failed",
    });
  }
};

exports.addTransaction = (req, res) => {
  const { transactionId, amount, referredBy, regDates, formDates } = req.body;
  const userId = req.auth?._id;

  if (!userId) {
    return res.status(401).json({
      message: "User Not Found",
      status: "Failed",
    });
  }
  const body = {
    transactionId: transactionId,
    userId: userId,
    verified: false,
    // status: status,
    amount: amount,
    formDates: formDates,
    referredBy: referredBy,
    userName: ''
  }
  console.log(body);
  // return res.json(body)
  
  User.findById(userId, (err, user) => {
    if(err)
    {
      return res.status(400).json({
        err: err.message,
      });
    }

    body.userName = user.name;

    if (user.paymentID !== "") {
      return res.status(300).json({
        message:
          "Already Paid. Please wait until we process your last transaction.",
        data: body,
      });
    }
    if (regDates !== user.regDates) {
      return res.status(400).json({
        message: "Dates were tampered with",
        success: false,
      });
    }
    const transaction = Transaction(body);
    // console.log("success saved trans");
    transaction.save((err, trn) => {
      if (err) {
        return res.status(400).json({
          message: "Failed to Add to our database. Please try again",
          err: err.message,
          data: body
        });
      }
      user.paymentID = transactionId;
      user.isPending = true;
      if(!user.regDates){
        user.regDates = "000";
      }
      // for (var i = 0; i < 3; i++)
      //   if (regDates[i] == "1" || formDates[i] == "1") regDates[i] = "1";
      // user.regDates = regDates;
      user.paymentID = transactionId;
      user.save();
      const response = {
        message: "Success",
        trnId: trn._id,
        ...user._doc,
        encry_password: undefined,
        salt:undefined
      };
      if(!referredBy || referredBy == "")
      {
        return res.status(200).json(response);
      }
      else{
        Referrals.findOne({referralId: referredBy}, (err, referral) => {
          if(err) {
            return res.status(400).json({
              message: "Transaction is Successful.\nBut Incorrect Referral ID Entered.",
              err: err.message,
              data: body
            });
          }

          referral.referralCount += 1;
          referral.save();

          return res.status(200).json(response);
        })
      }
    })
  })
}

exports.manualPaymentVerification = (req, res) => {
  // console.log(req.body)
  const { transactionId, isVerified } = req.body;

  // console.log({ transactionId, isVerified });

  Transaction.findOne({ transactionId: transactionId }, (err, trn) => {
    if (err) {
      return res.status(400).json({
        err: err.message,
      });
    }
    trn.verified = isVerified;
    trn.status = isVerified ? "Success" : trn.status;
    trn.verificationStatus = isVerified ? 1 : 2;
    trn.save();
    User.findById(trn.userId, (err, user) => {
      if (err) {
        return res.status(400).json({
          err: err.message,
        });
      }
      user.paid = true;
      user.isPending = false;
      user.paymentID = '';
      if(isVerified){
        let s = [];
        for(var i = 0; i < 3; ++i){
          if(trn.formDates[i] == '1' || user.regDates[i] == '1')s.push('1');
          else s.push('0');
        }
        s = s.join('');
        user.regDates = s;
      }
      user.save();
      return res.status(200).json({
        message: "Verified",
      });
    });
  });
};

exports.checkStatus = (req, res) => {
  const userId = req.auth?._id;
  User.findById(userId, (err, user) => {
    if (err) {
      return res.status(400).json({
        err: err.message,
      });
    }
    return res.status(200).json({ isVerified: user.isVerified });
  });
};

exports.getAllTransactions = (req, res) => {
  Transaction.find().then((trn) => {
    return res.status(200).json(trn);
  })
}

const makeReferralCode = (code) => {
  var cd = "TZ";
  var count = 2;
  if(code > 9)
    count -= 1
  if(code > 99)
    count -= 1
  for(var i=0;i<count;i++) {
    cd += "0"
  }
  cd += code;
  return cd;
}

exports.addReferralCodes = (req, res) => {
  const { referralCodes } = req.body;
  referralCodes.forEach((code) => {
    code.referralId = makeReferralCode(code.referralId)
    const ref = new Referrals(code);
    ref.save((err, ref) => {
      if(err){
        console.log("Error Occured at:",code.referralId,code.subCoreName);
        console.log("Error:", err.message)
        return res.status(400).json({message: err.message, success: false })
      }
      console.log("[Success]", ref.referralId, ref.subCoreName)
    })
  })
  return res.json({ message: "All Executed Successfully"})
}

exports.getTransactions = (req, res) => {
  const userId = req.auth?._id;
  console.log(userId);
  Transaction.find({ userId: userId }).then((user) => {
    // console.log("hit");
    console.log(user);
    return res.status(200).json(user);
  });
};
