const express = require("express");
const route = express.Router();

// MIDDLEWARE
const {
  isSignedIn,
  unauthorizedAccess,
  isVerified,
} = require("../middleware/auth");
const { hasReadWriteAccess } = require("../middleware/TZ");

const {
  addBlog,
  deleteBlog,
  getBlogs,
  getBlogById,
  updateBlog,
} = require("../controller/blogs");

// BLOGS ROUTES
route.post(
  "/addBlog",
  isSignedIn,
  // unauthorizedAccess,
  hasReadWriteAccess,
  addBlog
);
route.get("/getBlogs", getBlogs);

route.get(
  "/getBlog/:id",
  isSignedIn,
  unauthorizedAccess,
  isVerified,
  getBlogById
);

route.get(
  "/deleteBlog",
  isSignedIn,
  unauthorizedAccess,
  hasReadWriteAccess,
  deleteBlog
);
route.get(
  "/deleteBlog/:id",
  isSignedIn,
  unauthorizedAccess,
  hasReadWriteAccess,
  deleteBlog
);

route.post(
  "/updateBlog/:id",
  isSignedIn,
  unauthorizedAccess,
  hasReadWriteAccess,
  updateBlog
);

module.exports = route;
