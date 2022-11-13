const cors = require("cors");
const bodyParser = require("body-parser");
const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
const connectDB = require("./config/db");
const cookieParser = require("cookie-parser");
const user = require("./routes/router");
// Load config
dotenv.config({ path: "./config/config.env" });

// console.log(process.env.SECRET);
connectDB();

const app = express();

//Body Parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// const corsConfig = {
//   credentials: true,
//   origin: true,
// };
// app.use(cors(corsConfig));
app.use(
  cors({
    origin: "https://www.technozion.in",
    methods: ["POST", "PUT", "GET", "OPTIONS", "HEAD"],
    credentials: true,
  })
);
app.use(cookieParser());
app.use("/api/auth", user);
app.use("/api/blog", require("./routes/blogs"));
app.use("/api/event", require("./routes/events"));
//Logging
if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

//Routes

const PORT = process.env.PORT || 5000;
app.listen(
  PORT,
  console.log(`app running in ${process.env.NODE_ENV} mode on port ${PORT}`)
);
