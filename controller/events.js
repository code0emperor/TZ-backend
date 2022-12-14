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

const valToTime = (val) => {
  const dat = Math.round(val * 24 * 60 * 60);
  var pref = "AM"
  if(val >= 0.5)
    pref = "PM";
  const secs = dat%60;
  const mins = parseInt(dat/60)%60;
  var pf = ""
  if (mins < 10)
    pf = "0";
  const hours = (parseInt(dat/3600)%24)%12 == 0 ? 12 : (parseInt(dat/3600)%24)%12;
  const time = hours+":"+pf+mins+pref
  // console.log(time)
  return time
}

const valToDate = (val) => {
  const dat_val = {
    44910: 15,
    44911: 16,
    44912: 17,
    44913: 18,
    44914: 19,
  }

  const Days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
  ]

  const dateEval = new Date(2022, 11, dat_val[val])
  const day = dateEval.getDay();
  const month = dateEval.getMonth();
  const year = dateEval.getFullYear();
  const date = dateEval.getDate();

  return `${Days[day]}, ${date}/${month+1}/${year}`
} 

exports.addEvent = (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        error: errors.array()[0].msg,
      });
    }

    var fields = req.body;
  
    fields.forEach(field => {

      if(field.start_time)field.start_time = valToTime(field.start_time)
      field.start_date = valToDate(field.start_date)

      if(field.end_time)field.end_time = valToTime(field.end_time)
      field.end_date = valToDate(field.end_date)

      field.organised_by = splitTrim(field.organised_by)

      if(field.location)field.location = field.location || 'TBD'

      if(field.poster) field.poster = field.poster || 'https://pbs.twimg.com/profile_images/908005302225723392/SEaaeJUH_400x400.jpg'

      // return res.json(field)
      // let start_date = new Date(field.start_date)
      // let end_date = new Date(field.end_date)

      // field.start_date = `${start_date.getFullYear}-${start_date.getMonth()}-${start_date.getDate()}`
      // field.end_date = `${end_date.getFullYear}-${end_date.getMonth()}-${end_date.getDate()}`

      const event = new Event(field);
      event.save((err, event) => {
        if (err) {
          console.log("Error: "+field.name);
          console.log(err.message);
          return res.status(400).json({
            err: err.message,
          });
        } else {
          console.log("Success: "+field.name)
        }
      });
    })
    return res.json({ message: "All Executed Successfully"})
  } catch (err) {
    return res.status(500).json({ message: err.message, success: false });
  }
};

exports.getEvents = (req, res) => {
  try {
    Event.find()
      .sort({ createdAt: 1 })
      .then((events) => {
        res.status(200).json(events);
      })
      .catch((err) => {
        return res.status(404).json({
          message: err.message,
        });
      });
  } catch (err) {
    return res.status(500).json({ message: err.message, success: false });
  }
};

exports.getEventById = (req, res) => {
  try {
    const id = req.params.id || req.query.id;
    Event.findById(id, (err, event) => {
      if (!err) {
        res.status(200).send(event);
      } else {
        res.status(400).send({ message: err.message });
      }
    });
  } catch (err) {
    return res.status(500).json({ message: err.message, success: false });
  }
};

exports.getEventByEventID =  (req, res) => {
  try {
    const id = req.params.id || req.query.id;
    Event.find({ eventID: id }, (err, event) => {
      if (!err) {
        res.status(200).send(event);
      } else {
        res.status(400).send({ message: err.message });
      }
    });
  } catch (err) {
    return res.status(500).json({ message: err.message, success: false });
  }
};

exports.fieldchange =  (req,res) => {

  try{
  Event.find( (err, event) => {
          if (err) {
            res.status(404).json({
              error: err,
            });
          }

          for(let i=0 ; i<event.length;i++)
          { 
            if(event[i].price == null || event[i].formLink == null || event[i].category == null )  {
            
              if(event[i].price == null) event[i].price = "Free";
              if(event[i].formLink == null) event[i].formLink = "NA";
              if(event[i].category == null) event[i].category = "";
              Event.findByIdAndUpdate(event[i]._id, event[i], { useFindAndModify: false })
              .then((data) => {
                if (!data) {
                  res.status(400).send({ message: "Cannot update" });
                } 
              })
              .catch((err) => {
                res.status(500).send({ message: err.message });
              });
          }
        }
        res.status(200).json(event);
        })
      }
catch (err) {
  return res.status(500).json({ message: err.message, success: false });
}
}

exports.getEventByCategorySpotlight = (req, res) => {
  try {
    const spotlight = "Spotlight";
    Event.find({ category: spotlight }, (err, event) => {
      if (!err) {
        res.status(200).send(event);
      } else {
        res.status(400).send({ message: err.message });
      }
    });
  } catch (err) {
    return res.status(500).json({ message: err.message, success: false });
  }
};

exports.getEventByCategoryWorkshop = (req, res) => {
  try {
    const workshop = "Workshop";
    Event.find({ category : workshop }, (err, event) => {
      if (!err) {
        res.status(200).send(event);
      } else {
        res.status(400).send({ message: err.message });
      }
    });
  } catch (err) {
    return res.status(500).json({ message: err.message, success: false });
  }
};

exports.updateEvent = (req, res) => {
  try {
    if (!req.body) {
      res.status(400).send({ message: "Data is required" });
    }    
    
    const { allEvents }  = req.body;

    allEvents.forEach(fields => {
      const id = fields._id;

      Event.findByIdAndUpdate(id, fields, { useFindAndModify: false })
        .then((data) => {
          if (!data) {
            console.log("[Failed]:",fields.name);
          } else {
            console.log("[Success]:",fields.name);
          }
        })
        .catch((err) => {
          res.status(500).send({ message: err.message });
        });
    })
    res.status(200).send({ message: "All changes were successfully updated"})
    
  } catch (err) {
    return res.status(500).json({ message: err.message, success: false });
  }
};

exports.deleteEvent = (req, res) => {
  try {
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
  } catch (err) {
    return res.status(500).json({ message: err.message, success: false });
  }
};

exports.registerEvent = (req, res) => {
  try {
    const users = req.body.emails;
    const eventID = req.params.id;
    Event.findOne({ eventID: eventID }, (err, event) => {
      if (err || !event) {
        return res.status(200).json({ message: err.message, success: false });
      } else { 
        let code = "";
        let num = -1;
        if (req.body.code) {
          let tempnum = "";
          code = req.body.code;
          for (let i = 0; i < code.length; i++) {
            if (code[i] >= "0" && code[i] <= "9") tempnum += code[i];
            else tempnum = "";
          }
          num = Number.parseInt(tempnum);
          const participants = event.participants;
          if (participants.length < num)
            return res
              .status(300)
              .json({ message: "invalid team code", success: false });
          if (
            users.length + event.participants[num - 1].length >
            event.teamMates
          ) {
            return res.status(300).json({
              message: "more teammates requested to register than allowed",
              success: false,
            });
          }
        } else {
          const eventName = event.name.split(" ");
          for (let i = 0; i < eventName.length; i++) {
            code += eventName[i][0];
          }
          const regCount = event.participants.length + 1;
          code += regCount.toString();
        }

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
        num > 0
          ? // eslint-disable-next-line array-callback-return
            team.map((userID) => {
              event.participant[num - 1].push(userID);
            })
          : event.participant.push(team);
        event.save();
        return res.status(200).json({
          success: true,
          message: "Participant/s successfully registered",
          code: code,
        });
      }
    });
  } catch (err) {
    return res.status(500).json({ message: err.message, success: false });
  }
};

exports.getParticipant = (req, res) => {
  try {
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
  } catch (err) {
    return res.status(500).json({ message: err.message, success: false });
  }
};
