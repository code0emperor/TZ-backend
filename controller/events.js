const Event = require("../model/Event");
const User = require("../model/User");
const { validationResult } = require("express-validator");
const dotenv = require("dotenv");

dotenv.config({
  path: "../config/config.env",
});

const splitTrim = (event) => {
  var ret = event.split(",");
  for (var i = 0; i < ret.length; i++) {
    ret[i] = ret[i].trim();
  }
  return ret;
};

exports.addEvent = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      error: errors.array()[0].msg,
    });
  }

  var fields = req.body;
  if (req.body.poster !== "") {
    fields["poster"] = req.body.poster;
  } else {
    fields["poster"] = "nothing";
  }

  // let start_date = new Date(fields.start_date)
  // let end_date = new Date(fields.end_date)

  // fields.start_date = `${start_date.getFullYear}-${start_date.getMonth()}-${start_date.getDate()}`
  // fields.end_date = `${end_date.getFullYear}-${end_date.getMonth()}-${end_date.getDate()}`

  const event = new Event(fields);
  event.save((err, event) => {
    if (err) {
      return res.status(400).json({
        err: err.message,
      });
    } else {
      return res.status(200).json(event);
    }
  });
};

exports.getEvents = (req, res) => {
  Event.find()
    .sort({ createdAt: -1 })
    .then((events) => {
      res.status(200).json(events);
    })
    .catch((err) => {
      return res.status(404).json({
        message: err.message,
      });
    });
};

exports.getEventById = (req, res) => {
  const id = req.params.id || req.query.id;
  Event.findById(id, (err, event) => {
    if (!err) {
      res.status(200).send(event);
    } else {
      res.status(400).send({ message: err.message });
    }
  });
};

exports.getEventByEventID = (req, res) => {
  const id = req.params.id || req.query.id;
  Event.find({ eventID: id }, (err, event) => {
    if (!err) {
      res.status(200).send(event);
    } else {
      res.status(400).send({ message: err.message });
    }
  });
};

exports.updateEvent = (req, res) => {
  if (!req.body) {
    res.status(400).send({ message: "Data is required" });
  }

  const id = req.params.id;
  var fields = req.body;

  if (fields.participant) fields.participant = splitTrim(fields.participant);

  if (fields.gallery) fields.gallery = splitTrim(fields.gallery);

  if (fields.video) fields.video = splitTrim(fields.video);

  fields.Event.findByIdAndUpdate(id, fields, { useFindAndModify: false })
    .then((data) => {
      if (!data) {
        res.status(400).send({ message: "Cannot update" });
      } else {
        res.status(200).json({ message: "Event updated successfully" });
      }
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    });
};

exports.deleteEvent = (req, res) => {
  const id = req.query.id || req.params.id;
  Event.findByIdAndDelete(id)
    .then((data) => {
      if (!data) {
        res.status(200).send({ message: "Cannot Delete" });
      } else {
        res.status(200).send({
          message: "Event deleted successfully",
        });
      }
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    });
};

// exports.registerEvent = (req, res) => {
//   const cur_user = req.auth;
//   const eventID = req.params.id;
//   Event.findOne({ eventID: eventID }, (err, event) => {
//     if (err || !event) {
//       return res.status(200).json({ message: err.message });
//     } else {
//       if (
//         event.participant.findIndex((participant, index) => {
//           if (participant.userID === cur_user._id) return true;
//         }) > -1
//       ) {
//         return res.json({ message: "Participant Already Registered" });
//       } else {
//         User.findById(cur_user._id, (err, user) => {
//           if (err || !user) {
//             return res
//               .status(200)
//               .json({ message: "Couldn't find participant" });
//           } else {
//             if (user.eventsEnrolled.indexOf(event.eventID) > -1) {
//               return res.json({ message: "Participant Already Registered" });
//             } else {
//               user.eventsEnrolled.push({
//                 eventID: event.eventID,
//                 name: event.name,
//               });
//               user.save();
//               event.participant.push({
//                 userID: cur_user._id,
//                 name: user.name,
//                 email: user.email,
//               });
//               event.save();
//             }
//           }
//         });
//         res.json({ message: "Participant Registered Successfully" });
//       }
//     }
//   });
// };

exports.registerEvent = (req, res) => {
  const users = req.body.emails;
  const eventID = req.params.id;
  Event.findOne({ eventID: eventID }, (err, event) => {
    if (err || !event) {
      return res.status(200).json({ message: err.message, success: false });
    } else {
      const team = [];
      for (let i = 0; i < users.length; i++) {
        User.findOne({ email: users[i] }, (err, user) => {
          if (err || !user) {
            return res.status(200).json({
              message: "Couldn't find participant",
              success: false,
              participant: users[i],
            });
          } else {
            if (user.eventsEnrolled.indexOf(event.eventID) > -1) {
              return res.status(200).json({
                message: "Participant Already Registered",
                participant: users[i],
                success: false,
              });
            } else {
              team.push(user);
            }
          }
        });
      }
      // eslint-disable-next-line array-callback-return
      team.map((userID) => {
        User.findById(userID, (err, user) => {
          user.eventsEnrolled.push({
            eventID: event.eventID,
            name: event.name,
          });
          user.save();
        });
      });
      event.participant.push(team);
      event.save();
    }
  });
};

exports.getParticipant = (req, res) => {
  const id = req.params.id || req.query.id;
  Event.findById(id, (err, event) => {
    if (err || !event) {
      return res.json({ message: "Unexpected Error" });
    } else {
      return res.json({
        participants: event.participant,
        eventName: event.name,
        eventID: event.eventID,
      });
    }
  });
};
