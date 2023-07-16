//jshint esversion:6
require('dotenv').config() // use environment variables to keep secret safe. It is important to use right at the top
const md5 = require('md5');  // Hashing function
const express = require("express");
const mongoose = require("mongoose");
const ejs = require("ejs");
const { Schema } = mongoose;
const bodyParser = require("body-parser");
const _ = require('lodash');
const port = 3000;
const app = express();
const uri = require(__dirname + "/uri.js");
const encrypt = require('mongoose-encryption');
const session = require('express-session');
const passport = require('passport');
const localStrategy = require('passport-local');
const passportLocalMongoose = require('passport-local-mongoose');

// passport-local-mongoose does the salting and hashing
// const bcrypt = require('bcrypt');
// const saltRounds = 11; // rounds of Salting
//Listening on port 3000 and if it goes well then logging a message saying that the server is running
app.listen(process.env.PORT || port, function(req, res){
  console.log('Server is connected to port ' + port + ' ...');
});

app.use(express.static("public")); // use to store static files like images css
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

// setup sessions to have a secret
// app use session package
// when server restarts cookie get destroyed
app.use(
  session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 30000} // assign time for cookie to expire in 1min, remove to mot include timeout
  })
);
//app.use(passport.authenticate('session'));
app.use(passport.initialize()); // initialize passport
app.use(passport.session());   // use a passport to manage our sessions

// const mongoDbServer = process.env.MONGODB
// mongoose.connect(mongoDbServer); // Start and connect to mongodb server
// DB connection
mongoose.connect("mongodb://127.0.0.1:27017/userDB", { useNewUrlParser: true });

// Level 5 Using Passport.js to Add Cookies and Sessions
// Create a user Schema with mongo encryption package
const userSchema = new mongoose.Schema({
    email: String,
    password: String
});
// userSchema to use passport local mongoose as a plugin
userSchema.plugin(passportLocalMongoose);

// Create user Model
const User = mongoose.model("User", userSchema);

// CHANGE: USE "createStrategy" INSTEAD OF "authenticate"
// Use passport local mongoose to create a local login strategy and set a passport to  serialize deserialize our user
passport.use(User.createStrategy());
//passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());   //
passport.deserializeUser(User.deserializeUser());  // checks cookies content

///////////////////////// GET REQUESTS  //////////////////////////////
app.get('/', function(req, res) {
  res.render('home');
});

app.get('/register', function(req, res) {
  res.render('register');
});

app.get('/login', function(req, res) {
  res.render('login');
});

app.get('/error', function(req, res) {
  res.render('error');
});

app.get("/secrets", function (req, res) {
  console.log(req.isAuthenticated());
  console.log(req.session.cookie.maxAge); // to check session time left
  if (req.isAuthenticated()) {
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
});

// check www.passportjs.org/tutorials/password/logout for the documentation
app.get('/logout', function(req,res , next){
  req.logout(function(err){
    if (err) {
      return next(err);
    }
    res.redirect('/');
  });
});
///////////////////////// POST REQUESTS  //////////////////////////////
app.post('/register', function(req, res) {
 User.register(
   {username: req.body.username }, req.body.password,
   function(err, user){
   if (err) {
     const errorMessage = "Oops! " + req.body.username + " email already exist"
     console.log(errorMessage);
     res.render('error', {error: errorMessage});
   }
   else {
     passport.authenticate('local')(req, res, function(){  // Authenticate password using their password and username
       res.redirect('/secrets');
     });
  }
 }
)
});

app.post('/login', function(req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });
  req.login(user, function(err){
    if (err) {
      const errorMessage = "Wrong! email or password"
      console.log(errorMessage);
      res.render('error', {error: errorMessage});
    }
    else { // Authenticate password using their password and username
      passport.authenticate('local',{ failureRedirect: '/login'}) // If failed redirect to login page
      (req, res, function(){
        res.redirect('/secrets'); // If successful redirect to secret page
      });
  }
 });
});








// Another code
// //jshint esversion:6
// require("dotenv").config();
// const express = require("express");
// const bodyParser = require("body-parser");
// const ejs = require("ejs");
// const mongoose = require("mongoose");
// const session = require("express-session");
// const passport = require("passport");
// const passportLocalMongoose = require("passport-local-mongoose");
//
// const app = express();
//
// app.use(express.static("public"));
// app.set("view engine", "ejs");
// app.use(bodyParser.urlencoded({ extended: true }));
//
// // app use session package
// app.use(
//   session({
//     secret: "Our little secret.",
//     resave: false,
//     saveUninitialized: false,
//   })
// );
//
// app.use(passport.initialize());
// app.use(passport.session());
//
// // DB connection
// mongoose.connect("mongodb://127.0.0.1:27017/userDB", { useNewUrlParser: true });
//
// // Schema
// const userSchema = new mongoose.Schema({
//   email: String,
//   password: String,
// });
//
// userSchema.plugin(passportLocalMongoose);
//
// // Model
// const User = mongoose.model("User", userSchema);
//
// passport.use(User.createStrategy());
//
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());
//
// // GET REQUESTS
// app.get("/", function (req, res) {
//   res.render("home");
// });
//
// app.get("/login", function (req, res) {
//   res.render("login");
// });
//
// app.get("/register", function (req, res) {
//   res.render("register");
// });
//
// app.get("/secrets", function (req, res) {
//   if (req.isAuthenticated()) {
//     res.render("secrets");
//   } else {
//     res.redirect("/login");
//   }
// });
//
// app.get("/logout", function (req, res, next) {
//   req.logout(function (err) {
//     if (err) {
//       return next(err);
//     } else {
//       res.redirect("/");
//     }
//   });
// });
//
// // POST REQUESTS
// app.post("/register", function (req, res) {
//   User.register(
//     { username: req.body.username },
//     req.body.password,
//     function (err, user) {
//       if (err) {
//         console.log(err);
//         res.redirect("/register");
//       } else {
//         passport.authenticate("local")(req, res, function () {
//           res.redirect("/secrets");
//         });
//       }
//     }
//   );
// });
//
// app.post("/login", function (req, res) {
//   const user = new User({
//     username: req.body.username,
//     password: req.body.password,
//   });
//
//   req.login(user, function (err) {
//     if (err) {
//       console.log(err);
//     } else {
//       passport.authenticate("local")(req, res, function () {
//         res.redirect("/secrets");
//       });
//     }
//   });
// });
//
// app.listen(3000, function () {
//   console.log("Server started on port 3000");
// });
//








// // Level 4 Salting and Hashing passwords
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
//       bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
//        // Store hash in your password DB.
//        const newUser =  new User({
//          email: req.body.username,
//          password:  hash //use salt function
//        });
//        newUser.save();
//        res.render('secrets');
//      });
//
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
//         // Load hash from your password DB.
//         bcrypt.compare(req.body.password, loginPost.password, function(err, result) {
//         if (result === true) {
//           // result == true
//           res.render("secrets");
//         }
//         else {
//           // result == false
//           res.render('error', {error: "Invalid password, try again!"});
//         }
//       });
//
//       }
//     }
//   }).catch(function(err) {
//     console.log(err);
//   });
//    // Login alternative
//   const authenticate = User.authenticate();
  // authenticate(req.body.username, req.body.password, function(err, result){
  //   if (!err) {
  //     if (result === false) {
  //       const errorMessage = "Invalid password"
  //       console.log(errorMessage);
  //       console.log(err);
  //       res.render('error', {error: errorMessage});
  //     }
  //     else {
  //       //const loginMessage = "Welcome " + result.username;
  //       res.redirect('/secrets');
  //       //res.render('secrets', {loginUser: loginMessage });
  //     }
  //      }
  // else if (err) {
  //       const errorMessage = req.body.username + " cannot be authenticated!"
  //       console.log(errorMessage);
  //       console.log(err);
  //       res.render('error', {error: errorMessage});
  //     }
  //
  // });
//
//
// });

















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
