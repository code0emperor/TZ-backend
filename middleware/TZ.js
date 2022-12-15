const dotenv = require("dotenv");
const User = require("../model/User");

dotenv.config({ path: "../config/config.env" });

exports.isAdmin = (req, res, next) => {
  const auth = req.auth;
  if(!auth) {
    return res.status(404).json({ message: "Signin First" });
  }
  User.findById(auth._id, (err, user) => {
    if (err || !user) {
      return res.status(404).json({ message: "User does not exist" });
    } else {
      if (user.userCode != process.env.ADMIN)
        return res
          .status(400)
          .json({ message: "User does not have admin permission" });
      else next();
    }
  });
};

exports.hasReadWriteAccess = (req, res, next) => {
  // console.log("in readwrite");
  // console.log(req.auth);
  User.findById(req.auth._id, (err, user) => {
    if (err || !user) {
      return res.status(404).json({ message: "User does not exist" });
    } else {
      console.log(user.userCode);
      let core = process.env.CORE + process.env.BLOGGER;
      let subcore = process.env.SUBCORE + process.env.BLOGGER;
      if (
        user.userCode === process.env.ADMIN ||
        user.userCode === core || 
        user.userCode === subcore
      )  next();
      else
        return res
          .status(400)
          .json({ message: "User does not have read/write permission" });
    }
  });
};

exports.checkSignin = (err, req, res, next) => {
  if (err.name === "UnauthorizedError") {
    return res.redirect("backend/signin");
  }
};
