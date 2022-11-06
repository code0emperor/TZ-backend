const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    eventID: {
      type: String,
      trim: true,
      required: true,
      maxlength: 200,
      unique: true,
    },
    teamMates: {
      type: Number,
      default: 1,
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
      required: [true, "Please enter summary of the event!"],
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
      required: [true, "Please enter start time!"],
    },
    end_date: {
      type: String,
      required: [true, "Please enter end time!"],
    },
    duration: {
      type: String,
      required: [true, "Please enter duration of event!"],
    },
    is_live: {
      type: Boolean,
      default: false,
    },
    is_destroy: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("event", eventSchema);
