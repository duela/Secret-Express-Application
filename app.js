//jshint esversion:6
const express = require("express");
// require mongoose
const mongoose = require("mongoose");
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

app.get('/login', function(req, res) {
  res.render('login');
});
app.get('/', function(req, res) {
  res.render('home');
});
app.get('/secrets', function(req, res) {
  res.render('secrets');
});
app.get('/register', function(req, res) {
  res.render('register');
});
app.get('/submit', function(req, res) {
  res.render('submit');
});
