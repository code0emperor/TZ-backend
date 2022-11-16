const express = require("express");
const route = express.Router();

const {
  signin,
  signout,
  issignedin,
  signup,
  verifyEmail,
  getCurrentUser,
  sendMail,
  getAllUsers,
} = require("../controller/auth");

const {
  changePassword,
  getUserById,
  requestPasswordReset,
  resetPassword,
} = require("../controller/user");

// MIDDLEWARE

const { isSignedIn, unauthorizedAccess } = require("../middleware/auth");

const { isAdmin } = require("../middleware/TZ");

// AUTH routes
route.get("/", (req, res) => {
  res.status(200).send("HELLO");
});
route.post("/signup", signup);
route.post("/signin", signin);
route.post("/issignedin",issignedin);
route.get("/signout", isSignedIn, unauthorizedAccess, signout);

route.get("/user/:id", isSignedIn, unauthorizedAccess, isAdmin, getUserById);
route.post("/changePassword", isSignedIn, unauthorizedAccess, changePassword);

route.post("/verifyEmail", verifyEmail);
route.get("/getCurrentUser", isSignedIn, unauthorizedAccess, getCurrentUser);
route.get("/sendMail", isSignedIn, unauthorizedAccess, sendMail);

route.get("/tzCheck", isSignedIn, unauthorizedAccess, isAdmin, getAllUsers);

route.post("/resetPasswordRequest", requestPasswordReset);
route.post("/resetPassword", resetPassword);

module.exports = route;
