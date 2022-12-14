const express = require("express");
const route = express.Router();

// MIDDLEWARE
const upload = require("../middleware/upload");
const { isSignedIn, unauthorizedAccess } = require("../middleware/auth");
const { hasReadWriteAccess } = require("../middleware/TZ");

const {
  addEvent,
  getEvents,
  deleteEvent,
  getEventById,
  getEventByEventID,
  updateEvent,
  registerEvent,
  fieldchange,
  getEventByCategoryWorkshop,
  getEventByCategorySpotlight,
  getParticipant,
} = require("../controller/events");
const router = require("./payment");

route.post(
  "/addEvent",
  isSignedIn,
  unauthorizedAccess,
  // hasReadWriteAccess,
  // upload.single("poster"),
  addEvent
);
route.get("/getEvents", getEvents);
route.get("/getEvent/:id", getEventById);
route.get("/getEventByEventID/:id", getEventByEventID);
route.get("/getEventByCategoryWorkshop", getEventByCategoryWorkshop);
route.get("/getEventByCategorySpotlight", getEventByCategorySpotlight);
route.get("/fieldchange",fieldchange);
route.get(
  "/deleteEvent/",
  isSignedIn,
  unauthorizedAccess,
  hasReadWriteAccess,
  deleteEvent
);
route.get(
  "/deleteEvent/:id",
  isSignedIn,
  unauthorizedAccess,
  hasReadWriteAccess,
  deleteEvent
);
route.post(
  "/updateEvent/:id",
  isSignedIn,
  unauthorizedAccess,
  hasReadWriteAccess,
  updateEvent
);
route.get(
  "/registerEvent/:id",
  isSignedIn,
  unauthorizedAccess,
  hasReadWriteAccess,
  registerEvent
);
route.get(
  "/getParticipant/:id",
  isSignedIn,
  unauthorizedAccess,
  hasReadWriteAccess,
  getParticipant
);

module.exports = route;
