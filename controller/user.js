const User = require("../model/User");
const crypto = require("crypto");
const CryptoJS = require("crypto-js");
const path = require("path");
const dotenv = require("dotenv");
const Token = require("../model/token");
const nodemailer = require("nodemailer");

dotenv.config({
  path: "config.env",
});

exports.getUserById = (req, res) => {
  const id = req.params.id;
  User.findById(id, (err, user) => {
    if (!err) {
      user.salt = undefined;
      user.encry_password = undefined;
      res.send(user);
    } else {
      res.status(400).send({ message: err.message });
    }
  });
};

exports.changePassword = (req, res) => {
  User.findById(req.auth._id).exec((err, user) => {
    if (err || !user) {
      return res.status(400).json({
        id: req.auth._id,
        error: "Something unexpected happen",
      });
    }
    if (req.body.old_password) {
      const encrypted_pass = CryptoJS.AES.decrypt(
        user.encry_password,
        process.env.SECRET
      ).toString(CryptoJS.enc.Utf8);
      if (req.body.old_password === encrypted_pass) {
        if (!req.body.new_password1) {
          return res.status(401).json({
            msg: "New password is invalid",
          });
        } else if (req.body.new_password1 != req.body.new_password2) {
          return res.status(401).json({
            msg: "New Passwords Do Not Match",
          });
        } else {
          const encrypted_pass_new = CryptoJS.AES.encrypt(
            req.body.new_password1,
            process.env.SECRET
          ).toString();
          user.encry_password = encrypted_pass_new;
          if (encrypted_pass_new === encrypted_pass) {
            return res.status(401).json({
              msg: "New password and old password cannot be same",
            });
          } else {
            User.findByIdAndUpdate(
              { _id: user._id },
              { $set: user },
              { new: true, useFindAndModify: false },
              (err, new_user) => {
                if (err) {
                  return res.status(400).json({
                    error: "You are not authorized to update this user",
                  });
                }
                user.salt = undefined;
                user.encry_password = undefined;
                res.json({ message: "Password changed successfully" });
              }
            );
          }
        }
      } else {
        return res.status(403).json({
          msg: "Old password doesn't match",
        });
      }
    } else {
      return res.json({
        msg: "Old password is invalid",
      });
    }
  });
};

exports.updateUser = (req, res) => {
  User.findByIdAndUpdate(
    { _id: req.auth._id },
    { $set: req.body },
    { new: true, useFindAndModify: false },
    (err, user) => {
      if (err) {
        return res.status(400).json({
          error: "You are not authorized to update this user",
        });
      }
      res.json({ message: "User updated successfully" });
    }
  );
};

exports.deleteUser = (req, res) => {
  const id = req.query.id || req.params.id;
  if (id == process.env.ADMIN_ID) {
    return res.status(401).json({ message: "Admin User Cannot Be Deleted!!!" });
  }
  User.findByIdAndDelete(id)
    .then((data) => {
      if (!data) {
        res.status(400).send({ message: "Cannot Delete" });
      } else {
        res.status(200).send({
          message: "User deleted successfully",
        });
      }
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    });
};

exports.requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) res.status(403).send("User does not exist");

  let token = await Token.findOne({ userId: user._id });
  if (token) await token.deleteOne();
  let resetToken = crypto.randomBytes(10).toString("hex");
  const hash = crypto
    .createHmac("sha256", user.salt)
    .update(resetToken)
    .digest("hex");

  await new Token({
    userId: user._id,
    token: hash,
    createdAt: Date.now(),
  }).save();

  const link = `${process.env.HOST}/backend/resetPasswordPage?token=${resetToken}&id=${user._id}`;
  sendMail(email, link);
  return res.json({ message: "Mail Sent to Registered Mail" });
};

exports.resetPassword = async (req, res) => {
  const userId = req.query.id;

  const token = req.query.token;
  let passwordResetToken = await Token.findOne({ userId });
  if (!passwordResetToken) {
    return res.status(403).render("resetPassword", {
      authCode: 3,
      message: "Invalid or expired password reset token",
    });
  }

  await User.findById(userId).exec((err, user) => {
    if (err || !user) {
      return res.status(400).json({
        id: req.auth._id,
        error: "Something unexpected happen",
      });
    }
    const hash_token = crypto
      .createHmac("sha256", user.salt)
      .update(token)
      .digest("hex");
    if (hash_token != passwordResetToken.token) {
      return res.status(403).render("resetPassword", {
        authCode: 3,
        message: "Invalid or expired password reset token",
      });
    }
    const { password1, password2 } = req.body;
    if (password1 != password2) {
      return res.status(403).render("resetPassword", {
        authCode: 3,
        message: "Passwords Do Not match",
      });
    }
    const hash = crypto
      .createHmac("sha256", user.salt)
      .update(password1)
      .digest("hex");
    user.encry_password = hash;
    User.findByIdAndUpdate(
      { _id: user._id },
      { $set: user },
      { new: true, useFindAndModify: false },
      async (err, new_user) => {
        if (err) {
          return res.status(400).json({
            error: "You are not authorized to update this user",
          });
        }
        await passwordResetToken.deleteOne();
        user.salt = undefined;
        user.encry_password = undefined;
        res.render("resetPassword", {
          authCode: 3,
          message: "Password reset successfully",
        });
      }
    );
  });
};

const sendMail = (email, link) => {
  var transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD,
    },
  });
  var mailOptions = {
    from: `TZ <noreply@TZnitw.in>`,
    to: email,
    subject: "Reset Your Password | TZ NITW",
    text: "Do not share this code with anyone",
    html: `
  <div style="background-color: rgb(60, 60, 60); margin: -1rem; height: fit-content; color:white!important">
    <div style=" margin: 0 10vw !important;   background-color: #141414;   min-height: 50vh;   color: white !important; padding: 10%">
      <div style="color: white;   padding: 1rem auto;   display: flex;   justify-content: center;">
        
      </div>
      <div style="padding: 0 2rem;   text-align: left;   font-family: "Clash Display", sans-serif;   color: white;">
        <h3 style="font-weight: 500;color: white !important;">We have received a request for Password Reset</h3>
        <div>  
          <p>
            <strong style="color: white !important;">Follow this link to Reset Your Password: </strong>
            <a style="color: blue !important;" href="${link}">Reset Your Password</a>
          </p>
          <p>Or Copy This Link: ${link}</p>
          <br>
          <p><b>The Link will expire in one hour.</b></p>
          <small style="color: crimson !important;">Do not share this link with anyone as it contains sensitive information related to your TZ Account.</small>
            <br />
            <br />
          <small style="color: aqua !important;">Please do not reply to this mail. It is auto generated and mails sent
            here are not attended to.</small>
          <br />
          <br />
          <footer>
            <hr style="color: gray" />
            <br />
  
            Best Wishes,
            <br />
            <br />
            <b>Technozion</b>
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
  var mail_sent = false;
  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      mail_sent = false;
    } else {
      mail_sent = true;
    }
  });
  return mail_sent;
};
