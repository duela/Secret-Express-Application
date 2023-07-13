//jshint esversion:6
require('dotenv').config() // use environment variables to keep secret safe. It is important to use right at the top
const md5 = require('md5');  // Hashing function
const express = require("express");
// require mongoose
const mongoose = require("mongoose");
const ejs = require("ejs");
const { Schema } = mongoose;
const bodyParser = require("body-parser");
const _ = require('lodash');
const port = 3000;
const app = express();
const uri = require(__dirname + "/uri.js");
const encrypt = require('mongoose-encryption');
const bcrypt = require('bcrypt');
const saltRounds = 10; // rounds of Salting
//Listening on port 3000 and if it goes well then logging a message saying that the server is running
app.listen(process.env.PORT || port, function(req, res){
  console.log('Server is connected to port ' + port + ' ...');
});


app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public")); // use to store static files like images css

const mongoDbServer = process.env.MONGODB
mongoose.connect(mongoDbServer); // Start and connect to mongodb server






// Level 4 Salting and Hashing passwords

// Create a user Schema
const userSchema = new mongoose.Schema({
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
      bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
       // Store hash in your password DB.
       const newUser =  new User({
         email: req.body.username,
         password:  hash //use salt function
       });
       newUser.save();
       res.render('secrets');
     });

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
        // Load hash from your password DB.
        bcrypt.compare(req.body.password, loginPost.password, function(err, result) {
        if (result === true) {
          // result == true
          res.render("secrets");
        }
        else {
          // result == false
          res.render('error', {error: "Invalid password, try again!"});
        }
      });

      }
    }
  }).catch(function(err) {
    console.log(err);
  });
});

















//
// // Level 3 Hashing passwords
//
// // Create a user Schema
// const userSchema = new mongoose.Schema({
//     email: String,
//     password: String
// });
//
// // Create user Model
// const User = mongoose.model("User", userSchema);
//
// app.get('/', function(req, res) {
//   res.render('home');
// });
// // using express app.route(). chainable route to reduce redundacy and typos
// app.route('/register')
// .get(function(req, res) {
//   res.render('register');
// })
// .post(function(req, res) {
//   User.findOne({email: req.body.username}).then(function(registerPost){
//     if (!registerPost) {
//       const newUser =  new User({
//         email: req.body.username,
//         password: md5(req.body.password)  //use bashing function
//       });
//       newUser.save();
//       res.render('secrets');
//     }
//     else {
//       const errorMessage = "Oops! " +req.body.username + " already exist!"
//       res.render('error', {error: errorMessage});
//     }
//   }).catch(function(err) {
//     console.log(err);
//     res.redirect('/');
//   });
// });
//
// app.route('/login')
// .get(function(req, res) {
//     // User.find({}).then(function(loginGet){
//     //   console.log(loginGet);
//     //   res.send(loginGet);
//     // }).catch(function(err){
//     //   console.log(err);
//     // });
//   res.render('login');
// })
// .post(function(req, res) {
//   User.findOne({email: req.body.username})
//   .then(function(loginPost){
//     if (!loginPost) {
//       console.log("No account");
//     }
//     else {
//       if (loginPost) {
//         if (loginPost.password === md5(req.body.password)) {   //use bashing function
//
//           res.render("secrets");
//         }
//         else {
//           res.render('error', {error: "Invalid password, try again!"});
//         }
//       }
//     }
//   }).catch(function(err) {
//     console.log(err);
//   });
// });

















//
// // Level 2 security and 3 encrypt ,mkey hashing
//
// // Create a user Schema
// const userSchema = new mongoose.Schema({
//     email: String,
//     password: String
// });
// // It is important that you add this plugin to the schema before you create the Mongoose model because the userSchema is passed as a parameter to create the new Mongoose model
// //const secret = uri.secret(); // or a unique key can be use as a form of string
// const secret = process.env.SECRET; //  using dot env to store secret safe
// // const secret = md5(process.env.SECRET); // ot alternatively using dot env to store secret safe and hashing function
// //userSchema.plugin(encrypt, { secret: secret, excludeFromEncryption: ['email'] }); // This encrypt the entire database and exclude "email"
// //userSchema.plugin(encrypt, { secret: secret, encryptedFields: ['password', 'socialNumber', 'creditCard'] }); // This encrypt only the "['password', 'socialNumber', 'creditCard']" in the entire database
// userSchema.plugin(encrypt, { secret: secret, encryptedFields: ['password'] }); // This encrypt only the "password" in the entire database
//
// // Create user Model
// const User = mongoose.model("User", userSchema);
//
//
// app.get('/', function(req, res) {
//   res.render('home');
// });
// // using express app.route(). chainable route to reduce redundacy and typos
// app.route('/register')
// .get(function(req, res) {
//   res.render('register');
// })
// .post(function(req, res) {
//   User.findOne({email: req.body.username}).then(function(registerPost){
//     if (!registerPost) {
//       const newUser =  new User({
//         email: req.body.username,
//         password: req.body.password
//       });
//       newUser.save();
//       res.render('secrets');
//     }
//     else {
//       const errorMessage = "Oops! " +req.body.username + " already exist!"
//       res.render('error', {error: errorMessage});
//     }
//   }).catch(function(err) {
//     console.log(err);
//     res.redirect('/');
//   });
// });
//
// app.route('/login')
// .get(function(req, res) {
//     // User.find({}).then(function(loginGet){
//     //   console.log(loginGet);
//     //   res.send(loginGet);
//     // }).catch(function(err){
//     //   console.log(err);
//     // });
//   res.render('login');
// })
// .post(function(req, res) {
//   User.findOne({email: req.body.username})
//   .then(function(loginPost){
//     if (!loginPost) {
//       console.log("No account");
//     }
//     else {
//       if (loginPost) {
//         if (loginPost.password === req.body.password) {
//
//           res.render("secrets");
//         }
//         else {
//           res.render('error', {error: "Invalid password, try again!"});
//         }
//       }
//     }
//   }).catch(function(err) {
//     console.log(err);
//   });
// });


// Level 1 Authentication and security
//
// // Create a user Schema
// const userSchema = new Schema({
//     email: String,
//     password: String
// });
//
// // Create user Model
// const User = mongoose.model("User", userSchema);
//
//
// app.get('/', function(req, res) {
//   res.render('home');
// });
// // using express app.route(). chainable route to reduce redundacy and typos
// app.route('/register')
// .get(function(req, res) {
//   res.render('register');
// })
// .post(function(req, res) {
//   User.findOne({email: req.body.username}).then(function(registerPost){
//     if (!registerPost) {
//       const newUser =  new User({
//         email: req.body.username,
//         password: req.body.password
//       });
//       newUser.save();
//       res.render('secrets');
//     }
//     else {
//       const errorMessage = "Oops! " +req.body.username + " already exist!"
//       res.render('error', {error: errorMessage});
//     }
//   }).catch(function(err) {
//     console.log(err);
//     res.redirect('/');
//   });
// });
//
// app.route('/login')
// .get(function(req, res) {
//   res.render('login');
// })
// .post(function(req, res) {
//   User.findOne({email: req.body.username})
//   .then(function(loginPost){
//     if (!loginPost) {
//       console.log("No account");
//     }
//     else {
//       if (loginPost) {
//         if (loginPost.password === req.body.password) {
//           res.render("secrets")
//         }
//         else {
//           res.render('error', {error: "Invalid password, try again!"});
//         }
//       }
//     }
//   }).catch(function(err) {
//     console.log(err);
//   });
// });
// .render('submit');
// // });
