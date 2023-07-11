//jshint esversion:6
const express = require("express");
// require mongoose
const mongoose = require("mongoose");
const ejs = require("ejs");
const { Schema } = mongoose;
const bodyParser = require("body-parser");
const _ = require('lodash');
const port = 3000;
const app = express();

//Listening on port 3000 and if it goes well then logging a message saying that the server is running
app.listen(process.env.PORT || port, function(req, res){
  console.log('Server is connected to port ' + port + ' ...');
});

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public")); // use to store static files like images css

mongoose.connect('mongodb://127.0.0.1:27017/userDB'); // Start and connect to mongodb server

// Create a user Schema
const userSchema = new Schema({
    email: String,
    password: String
});

// Create user Model
const User = mongoose.model("User", userSchema);


app.get('/', function(req, res) {
  res.render('home');
});
// using express app.route(). chainable route to reduce redundacy and typos
app.route('/register')
.get(function(req, res) {
  res.render('register');
})
.post(function(req, res) {
  User.findOne({email: req.body.username}).then(function(registerPost){
    if (!registerPost) {
      const newUser =  new User({
        email: req.body.username,
        password: req.body.password
      });
      newUser.save();
      res.render('secrets');
    }
    else {
      const errorMessage = "Oops! " +req.body.username + " already exist!"
      res.render('error', {error: errorMessage});
    }
  }).catch(function(err) {
    console.log(err);
    res.redirect('/');
  });
});

app.route('/login')
.get(function(req, res) {
  res.render('login');
})
.post(function(req, res) {
  User.findOne({email: req.body.username})
  .then(function(loginPost){
    if (!loginPost) {
      console.log("No account");
    }
    else {
      if (loginPost) {
        if (loginPost.password === req.body.password) {
          res.render("secrets")
        }
        else {
          res.render('error', {error: "Invalid password, try again!"});
        }
      }
    }
  }).catch(function(err) {
    console.log(err);
  });
});





// app.get('/secrets', function(req, res) {
//   res.render('secrets');
// });
// app.get('/submit', function(req, res) {
//   res.render('submit');
// });
