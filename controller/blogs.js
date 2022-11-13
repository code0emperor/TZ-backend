const Blogs = require("../model/Blog");
const Users = require("../model/User");
const { check, validationResult } = require("express-validator");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({
  path: "config.env",
});

const splitTrim = (event) => {
  var ret = event.split(",");
  for (var i = 0; i < ret.length; i++) {
    ret[i] = ret[i].trim();
  }
  console.log(ret);
  return ret;
};

exports.addBlog = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      error: errors.array()[0].msg,
    });
  }

  var fields = req.body;

  if (fields.writer) fields.writer = splitTrim(fields.writer);

  const blog = new Blogs(fields);
  blog.save((err, blog) => {
    if (err) {
      return res.status(400).json({
        err: err.message,
      });
    }
    console.log("blogs made");
    res.status(200).json({
      message: "Success",
      blogId: blog._id,
    });
  });
};

exports.getBlogs = async (req, res) => {
    try{
      const blogs  = await Blogs.find();
      res.status(200).json(blogs);
  }catch(err){
    res.status(500).json(err);
  }
};

exports.getBlogById = (req, res) => {
    const id = req.params.id || req.query.id;
    Blogs.findById(id, (err, blog) => {
      if (!err) {
        res.status(200).json(blog);
      } else {
        res.status(400).send({ message: err.message });
      }
    });
  };

exports.updateBlog = (req, res) => {
  if (!req.body) {
    res.status(400).send({ message: "Data is required" });
  }

  const id = req.params.id;
  var fields = req.body;

  if (fields.writer) fields.writer = splitTrim(fields.writer);

  Blogs.findByIdAndUpdate(id, fields, { useFindAndModify: false })
    .then((data) => {
      if (!data) {
        res.status(400).send({ message: "Cannot update" });
      } else {
        res.status(200).redirect("/backend/blogs");
      }
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    });
};

exports.deleteBlog = (req, res) => {
  const id = req.query.id || req.params.id;
  Blogs.findByIdAndDelete(id)
    .then((data) => {
      if (!data) {
        res.status(400).send({ message: "Cannot Delete" });
      } else {
        res.status(200).redirect("/backend/blogs");
      }
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    });
};
