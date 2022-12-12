const User = require("../model/User");
var jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const CryptoJS = require("crypto-js");

const dotenv = require("dotenv");
dotenv.config({
  path: "../config/config.env",
});

exports.signup = (req, res) => {
  try {
    const fields = req.body;

    const password = CryptoJS.AES.encrypt(
      fields.encry_password,
      process.env.SECRET
    ).toString();

    fields.encry_password = password;
    const email = fields.email.split("@");
    email[1] === "student.nitw.ac.in"
      ? (fields.isStudent = true)
      : (fields.isStudent = false);
    // console.log(email);
    if (fields.isStudent) fields.paid = true;
    const user = new User(fields);

    user.save((err, user) => {
      if (err) {
        let message = "Duplicate ";
        let flag = false;
        for (let i = 0; i < err.message.length; i++) {
          if (err.message[i] === "{" || err.message[i] === "}") flag = !flag;
          else if (flag && err.message[i] !== '"') {
            message += err.message[i];
          }
        }
        message += " registered";
        return res.status(200).json({
          message: message,
          success: false,
        });
      }

      const verificationRoute = CryptoJS.AES.encrypt(
        user.email,
        process.env.SECRET
      ).toString();

      req.auth = { _id: user._id };
      var mail = sendMail_1(
        user.email,
        user.isVerified,
        user.name,
        verificationRoute
      );
      res.status(200).json({
        success: true,
        message: "account made successfully",
        name: user.name,
        email: user.email,
        id: user._id,
        userCode: user.userCode,
        isPaid: user.paid,
        student: user.isStudent,
        verificationRoute: verificationRoute,
        mail: mail,
      });
    });
  } catch (err) {
    return res.status(500).json({ message: err.message, success: false });
  }
};

exports.getAllUsers = (req, res) => {
  try {
    User.find({}, (err, user) => {
      if (err) {
        res.status(404).json({
          error: err,
        });
      }
      res.status(200).json({
        users: user,
      });
    });
  } catch (err) {
    return res.status(500).json({ message: err.message, success: false });
  }
};

exports.getUserCount = (req, res) => {
  try {
    User.countDocuments( {}, function(err, result){

      if(err){
          res.send(err)
      }
      else{
        console.log(result);
          res.status(200).json({
                  studentCount: result,
                });
      }
    
    })
  } catch (err) {
    return res.status(500).json({ message: err.message, success: false });
  }
};

// exports.getUserCount = (req, res) => {
//   try {
//     let studentCount = 0;
//     User.find({ isStudent: true }, (err, user) => {
//       if (err) {
//         res.status(404).json({
//           error: err,
//         });
//       }
//       studentCount++;
//     });
//     res.status(200).json({
//       studentCount: studentCount,
//     });
//   } catch (err) {
//     return res.status(500).json({ message: err.message, success: false });
//   }
// };

exports.issignedin = (req, res) => {
  const token = req.body.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.SECRET);

      User.findById(decoded._id, (err, user) => {
        if (user)
          return res.status(200).json({
            isLoggedIn: true,
            user: user,
            message: "User already logged in",
          });
        else
          return res
            .status(400)
            .json({ isLoggedIn: false, message: "unauthorized" });
      });
    } catch (e) {
      return res
        .status(400)
        .json({ isLoggedIn: false, message: "unauthorized" });
    }
  } else
    return res
      .status(200)
      .json({ isLoggedIn: false, message: "User is not logged in" });
};

exports.signin = (req, res) => {
  try {
    const { email, password } = req.body;
    if (req.body.cookieToken) {
      const cookieToken = req.body.token;
      try {
        const decoded = jwt.verify(cookieToken, process.env.SECRET);

        User.findById(decoded._id, (err, user) => {
          if (user)
            return res
              .status(200)
              .json({ message: "User already logged in", success: true });
          else
            return res
              .status(400)
              .json({ message: "unauthorized", success: false });
        });
      } catch (e) {
        return res.status(400).json({ message: e.message, success: false });
      }
    }
    User.findOne({ email }, (err, user) => {
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User Does Not Exist" });
      }

      if (user.isVerified !== 1) {
        return res.status(401).json({
          message:
            "Please click on the link sent to your registered email to activate your account",
          success: false,
        });
      }

      const Originalpassword = CryptoJS.AES.decrypt(
        user.encry_password,
        process.env.SECRET
      ).toString(CryptoJS.enc.Utf8);

      if (Originalpassword !== password)
        return res
          .status(200)
          .json({ success: false, message: "Invalid Credentials" });

      //create token
      const token = jwt.sign({ _id: user._id }, process.env.SECRET);
      //put token in cookie
      res.cookie("token", token, { expire: new Date() + 9999 });
      user.lastLogin = new Date();
      user.save();
      //send response to front end
      return res.status(200).json({
        user: user,
        name: user.name,
        email: user.email,
        success: true,
        message: "Logged In Successful",
        isVerified: user.isVerified,
        eventsEnrolled: user.eventsEnrolled,
        token: token,
        userCode: user.userCode,
      });
    });
  } catch (e) {
    return res.status(400).json({ message: e.message, success: false });
  }
};

exports.signout = (req, res) => {
  res.clearCookie("token");
  res.status(200).json({
    success: true,
    message: "User signout successfully",
  });
};

exports.verifyEmail = (req, res) => {
  // const user = req.auth;
  const verificationRoute = req.body.verificationRoute;
  const email = CryptoJS.AES.decrypt(
    verificationRoute,
    process.env.SECRET
  ).toString(CryptoJS.enc.Utf8);
  User.findOne({ email: email }, (err, user) => {
    if (!user || err)
      return res
        .status(300)
        .json({ message: "User not found", success: false });

    if (user.isVerified) {
      return res
        .status(200)
        .json({ message: "User Already Verified", success: true });
    }
    user.isVerified = 1;
    user.save();
    return res
      .status(200)
      .json({ message: "User successfully verified", success: true });
  });
};

exports.getCurrentUser = (req, res) => {
  const user = req.auth;
  if (!user || !user._id) {
    return res.status(406).json({
      message: "user id should not be empty",
      success: false,
    });
  }
  User.findById(user._id)
    .then((user) => {
      user.salt = undefined;
      user.encry_password = undefined;
      return res.status(200).json(user);
    })
    .catch((err) => {
      return res.status(400).json({ message: err.message, success: false });
    });
};

exports.sendMail = (req, res) => {
  const user = req.auth;
  if (!user) {
    return res.status(406).json({
      message: "no user found",
    });
  }
  User.findById(user._id)
    .then((user) => {
      if (user.isVerified === 0) {
        res.status(202).json({
          message: "User already verified",
        });
        return;
      } else {
        var transporter = nodemailer.createTransport({
          service: "Gmail",
          auth: {
            user: process.env.EMAIL,
            pass: process.env.PASSWORD,
          },
        });
        var mailOptions = {
          from: `TZ <${process.env.EMAIL}>`,
          to: user.email,
          subject: "Verify Email with TZ-NITW",
          text: "Do not share this code with anyone",
          html: `<div style="background-color: rgb(60, 60, 60); margin: -1rem; height: fit-content; color:white!important">
          <div style=" margin: 0 10vw !important;   background-color: #141414;   min-height: 100vh;   color: white !important; padding: 10%">
            <div style="color: white;   padding: 2rem auto;   display: flex;   justify-content: center;">
            </div>
            <div style="padding: 0 2rem;   text-align: left;   font-family: "Clash Display", sans-serif;   color: white;">
              <h3 style="font-weight: 500;color: white !important;">Dear ${user.name},</h3>
              <div>
                <p>
                  Thank You For Registering on our
                  <a style="color: white;" href="" target="_blank">new website</a>
                </p>
        
                <p>
                  <strong style="color: white !important;">Here's your verification code: </strong>
                  <b><big style="color: white !important;">${user.isVerified}</big></b>
                </p>
        
                <span  style="color: white !important;">
                  Here are some of the cool things that we've added to our new website:
                  <ul type="circle"  style="color: white !important;">
                    <li style="color: white !important;">One Tap Event Registration for all CSEA Events</li>
                    <li style="color: white !important;">Blogs & Catalogues</li>
                    <li style="color: white !important;">Events Results</li>
                    <li style="color: white !important;">And a lot of awesomeness!</li>
                  </ul>
                  <p style="color: white !important;">
                    Hope you enjoy using the website, as much as we enjoyed building it!
                  </p>
                </span>
                <small style="color: aqua !important;"
                  >Please do not reply to this mail. It is auto generated and mails sent
                  here are not attended to.</small
                >
                <br />
                <br />
                <br />
                <footer>
                  <hr style="color: gray" />
                  <br />
        
                  Best Wishes,
                  <br />
                  <br />
                  Technozion
                  <br />
                  NIT Warangal<br />
        
                  Contact Us:
                  <a style="color: white;" style="color: white" href="mailto:rr912072@student.nitw.ac.in"
                    >rr912072@student.nitw.ac.in</a
                  >
        
                  <p style="margin-top: 0.3rem !important;">
                    Visit us on
                    <a style="color: white;" href="" target="blank"> Our Website </a> |
                    <a style="color: white;" href="https://www.instagram.com/technozion_22/" target="blank"
                      >Instagram</a
                    >
                  </p>
                </footer>
              </div>
            </div>
          </div>
        
          <!--  -->
        </div>`,
        };
        transporter.sendMail(mailOptions, (err, info) => {
          if (err) {
            res.status(400).json({
              message: "Bad request",
            });
          } else {
            res.status(200).json({
              message: "mail sent",
            });
          }
        });
        res.status(200).json({
          message: "mail sent",
        });
        return;
      }
    })
    .catch((err) => {
      res.status(400).json({
        message: "Bad request",
      });
      return;
    });
};

exports.manageAccess = (req, res) => {
  const userCode = req.body.userCode;
  if (!userCode) {
    return res.status(400).json({ error: "Give role" });
  }
  const id = req.params.id || req.query.id;
  if (id === process.env.ADMIN_ID) {
    return res.status(200).redirect("/backend/permission?change=error");
  }
  User.findById(id)
    .then((user) => {
      user.userCode = userCode;
      user.save();
      return res.status(200).redirect("/backend/permission?change=true");
    })
    .catch((err) => {
      return false;
    });
};

const sendMail_1 = (email, code, name, verRoute) => {
  var transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD,
    },
  });
  var mailOptions = {
    from: `TZ <${process.env.EMAIL}>`,
    to: email,
    subject: "Verify Email with TZ-NITW",
    text: "Do not share this code with anyone",
    html: `
  <div style="background-color: rgb(60, 60, 60); margin: -1rem; height: fit-content; color:white!important">
    <div style=" margin: 0 10vw !important;   background-color: #141414;   min-height: 100vh;   color: white !important; padding: 10%">
      <div style="color: white;   padding: 2rem auto;   display: flex;   justify-content: center;">
      </div>
      <div style="padding: 0 2rem;   text-align: left;   font-family: "Clash Display", sans-serif;   color: white;">
        <h3 style="font-weight: 500;color: white !important;">Dear ${name},</h3>
        <div>
          <p>
            Thank You For Registering on our
            <a style="color: white;" href="" target="blank">new website</a>
          </p>
  
          <p>
            <strong style="color: white !important;">Here's your verification Link: </strong>
            <a href="https://www.technozion.in/verify/${verRoute}"><b><big style="color: white !important;">https://www.technozion.in/verify/${verRoute}</big></b></a>
          </p>
          <small style="color: aqua !important;"
            >Please do not reply to this mail. It is auto generated and mails sent
            here are not attended to.</small
          >
          <br />
          <br />
          <br />
          <footer>
            <hr style="color: gray" />
            <br />
  
            Best Wishes,
            <br />
            <br />
            Technozion
            <br />
            NIT Warangal<br />
  
            Contact Us:
            <a style="color: white;" style="color: white" href="mailto:rr912072@student.nitw.ac.in"
              >rr912072@student.nitw.ac.in</a
            >
  
            <p style="margin-top: 0.3rem !important;">
              Visit us on
              <a style="color: white;" href="" target="blank"> Our Website </a> |
              <a style="color: white;" href="https://www.instagram.com/technozion_22/" target="blank"
                >Instagram</a
              >
            </p>
          </footer>
        </div>
      </div>
    </div>
  
    <!--  -->
  </div>`,
  };
  var mail_sent = true;
  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      mail_sent = false;
    } else {
      mail_sent = true;
    }
  });
  return mail_sent;
};
