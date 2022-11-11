const User = require("../model/User");
var jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const CryptoJS = require("crypto-js");

const dotenv = require("dotenv");
dotenv.config({
  path: "../config/config.env",
});

exports.signup = (req, res) => {
  const fields = req.body;

  const password = CryptoJS.AES.encrypt(
    fields.encry_password,
    process.env.SECRET
  ).toString();

  fields.encry_password = password;
  // console.log(fields.encry_password);
  const user = new User(fields);

  user.save(async (err, user) => {
    if (err) {
      return res.status(200).json({
        err: err.message,
      });
    }

    const verificationRoute = CryptoJS.AES.encrypt(
      user.email,
      process.env.SECRET
    ).toString();

    req.auth = { _id: user._id };
    var mail = await sendMail_1(
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
      isVerified: user.isVerified,
      eventsEnrolled: user.eventsEnrolled,
      userCode: user.userCode,
      verificationRoute: verificationRoute,
      mailSent: mail,
    });
  });
};

exports.getAllUsers = (req, res) => {
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
};

exports.signin = async (req, res) => {
  console.log(req.cookies);
  if (req.cookies && req.cookies.token) {
    res.status(200).json({ message: "User already logged in" });
    return;
  }
  console.log(req.body);
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  console.log(user);
  const Originalpassword = CryptoJS.AES.decrypt(
    user.encry_password,
    process.env.SECRET
  ).toString(CryptoJS.enc.Utf8);

  Originalpassword !== password &&
    res.status(200).json({ success: false, message: "Invalid Credentials" });

  //create token
  const token = jwt.sign({ _id: user._id }, process.env.SECRET);
  //put token in cookie
  res.cookie("token", token, { expire: new Date() + 9999 });
  user.lastLogin = new Date();
  user.save();
  //send response to front end
  return res.status(200).json({
    name: user.name,
    email: user.email,
    success: true,
    message: "Logged In Successful",
    isVerified: user.isVerified,
    eventsEnrolled: user.eventsEnrolled,
    token: token,
    userCode: user.userCode,
  });
};

exports.signout = (req, res) => {
  res.clearCookie("token");
  res.status(200).json({
    message: "User signout successfully",
  });
};

exports.verifyEmail = (req, res) => {
  const user = req.auth;
  const verificationRoute = req.body.verificationRoute;
  User.findById(user._id)
    .then((user) => {
      if (user.isVerified === 1) {
        return res.status(202).json({ message: "Email already Verified" });
      }
      const id = CryptoJS.AES.decrypt(
        verificationRoute,
        process.env.SECRET
      ).toString(CryptoJS.enc.Utf8);

      if (user.email === id) {
        User.findByIdAndUpdate(
          user._id,
          { isVerified: 1 },
          { useFindAndModify: false }
        )
          .then((data) => {
            if (!data) {
              res.status(400).send({ message: "Cannot update" });
            } else {
              res.status(200).json({ message: "Email Verification Done" });
            }
          })
          .catch((err) => {
            res.status(500).send({ message: err.message });
          });
      }
    })
    .catch((err) => {
      res.status(500).send({ message: err });
    });
};

exports.getCurrentUser = (req, res) => {
  const user = req.auth;
  if (!user || !user._id) {
    return res.status(406).json({
      message: "user id should not be empty",
    });
  }
  User.findById(user._id)
    .then((user) => {
      user.salt = undefined;
      user.encry_password = undefined;
      return res.status(200).json(user);
    })
    .catch((err) => {
      return res.status(400).json({ message: "Bad request" });
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
            <a href="http://technozion-22/verify/${verRoute}"><b><big style="color: white !important;">http://technozion-22/verify/${verRoute}</big></b></a>
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
