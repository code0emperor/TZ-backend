const User = require("../model/User");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config({ path: "../config/config.env" });

// const SECRET = process.env.SECRET;

//protected routes
exports.isSignedIn = (req, res, next) => {
  const token = req.body.token;
  const authHeader = req.headers.token || token || req.body.token;
  // console.log(req.body);
  if (authHeader) {
    const token = authHeader;
    // console.log(token);
    jwt.verify(token, process.env.SECRET, (err, user) => {
      if (err) return res.status(403).json("Token is not valid");
      req.auth = user;
      console.log(user);
      next();
    });
  } else {
    return res.status(401).json("You are not authenticated");
  }
};

exports.unauthorizedAccess = (err, req, res, next) => {
  // console.log("hey");
  // console.log(err);
  if (err.name === "UnauthorizedError") {
    return res.status(403).send({
      success: false,
      message: "User is not Logged in",
    });
  }
};

exports.isVerified = (req, res, next) => {
  User.findById(req.auth._id, (err, user) => {
    if (err || !user) {
      return res.status(403).send({ message: "User is not logged in" });
    } else {
      if (user.isVerified !== 0) {
        return res.status(403).json({ message: "User not verified" });
      } else next();
    }
  });
};
