const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      required: true,
      maxlength: 200,
    },
    writer: {
      type: Array,
      default: [],
    },
    summary: {
      type: String,
      required: true,
      maxlength: 400,
    },
    image: {
        type:String,
        required : true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("blogs", blogSchema);
