const express = require("express");
const path = require("path");
const PORT = process.env.PORT || 3001;
const app = express();
const bodyParser = require("body-parser");
// const routes = require("./routes")
const passport = require("passport");
const config = require("./server/config");
const logger = require("morgan");
const mongoose = require('mongoose')


// connect to the database and load models
// uses environmental variable for deployment (Heroku) or defaults to local config

const uri = process.env.MONGODB_URI || config.dbUri;

mongoose.connect(uri);
  
//plug in the promise library:
mongoose.Promise = global.Promise;

mongoose.connection.on("error", (err) => {
  console.error(`Mongoose connection error: ${err}`);
  process.exit(1);
});

require("./server/models");

// Use morgan logger for logging requests
app.use(logger("dev"));

// Serve up static assets (usually on heroku)
if (process.env.NODE_ENV === "production") {
  app.use(express.static("client/build"));
}

// Configure body parser for AJAX requests
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// pass the passport middleware
app.use(passport.initialize());

// load passport strategies
const localSignupStrategy = require('./server/passport/local-signup');
const localLoginStrategy = require('./server/passport/local-login');
passport.use('local-signup', localSignupStrategy);
passport.use('local-login', localLoginStrategy);

// pass the authentication checker middleware
const authCheckMiddleware = require('./server/middleware/auth-check');
app.use('/api', authCheckMiddleware);
// Serve up static assets
app.use(express.static("client.build"));

// add routes
const authRoutes = require('./server/routes/auth');
const apiRoutes = require('./server/routes/api');
app.use('/auth', authRoutes);
app.use('/api', apiRoutes);

// Send every request to the React app
// Define any API routes before this runs
app.get("*", function(req, res) {
  res.sendFile(path.join(__dirname, "./client/build/index.html"));
});

const ver = require('./package.json').version;
console.log("version =", ver);

app.listen(PORT, function() {
  console.log(`🌎 ==> Server now on port ${PORT}!`);
});
