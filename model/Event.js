const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    eventID: {
      type: String,
      trim: true,
      required: false,
      maxlength: 200,
    },
    teamMates: {
      type: String,
      default: "1",
    },
    name: {
      type: String,
      required: [true, "Enter event name!"],
      maxlength: 400,
    },
    organised_by: {
      type: Array,
      required: [true, "Enter Organising Club names!"],
    },
    assigned_to: {
      type: Array,
      default: [],
    },
    poster: {
      type: String,
      required: [true, "Add event Poster"],
    },
    video: {
      type: Array,
      trim: true,
      required: false,
    },
    summary: {
      type: String,
      required: [false, "Please enter summary of the event!"],
    },
    description: {
      type: String,
      required: [true, "Please enter description of the event"],
    },
    gallery: {
      type: Array,
      default: [],
    },
    participant: {
      type: Array,
      default: [],
    },
    start_date: {
      type: String,
      required: [true, "Please enter start date!"],
    },
    end_date: {
      type: String,
      required: [true, "Please enter end date!"],
    },
    end_time: {
      type: String,
      // required: [true, "Please the end time!"],
    },
    start_time: {
      type: String,
      // required: [true, "Please enter start time!"],
    },
    duration: {
      type: String,
    },
    is_live: {
      type: Boolean,
      default: false,
    },
    is_destroy: {
      type: Boolean,
      default: false,
    },
    location: {
      type: String,
      required: true,
    },
    price : {
      type: String,
      default: "Free",
    },
    formLink : {
    type : String,
    default: "NA",
    },
    category : {
     type : String,
     default: "",
  } ,
  },
  { timestamps: true }
);

module.exports = mongoose.model("event", eventSchema);
