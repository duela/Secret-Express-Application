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
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const TwitterStrategy = require("passport-twitter").Strategy;
const findOrCreate = require('mongoose-findorcreate');

// passport-local-mongoose does the salting and hashing
// const bcrypt = require('bcrypt');
// const saltRounds = 11; // rounds of Salting
//Listening on port 3000 and if it goes well then logging a message saying that the server is running
app.listen(process.env.PORT || port, function(req, res){
  console.log('Server is connected to port ' + port + ' ...');
});
  //////// function(req, res) ///////
// console.log(req);     // examine calls from the client side, make HHTP requests and handle incoming data where in string or JSON object
// console.log(res);     // represent the HTTP response that an Express app sends when it gets an HTTP request

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
    cookie: { maxAge: null} // assign time for cookie to expire in 1min, remove to mot include timeout
  })
);
//app.use(passport.authenticate('session'));
app.use(passport.initialize()); // initialize passport
app.use(passport.session());   // use a passport to manage our sessions

const mongoDbServer = process.env.MONGODB
mongoose.connect(mongoDbServer); // Start and connect to mongodb server


// Level 5 Using Passport.js to Add Cookies and Sessions
// Create a user Schema with mongo encryption package
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    username: String,
    twitterId: String,
    googleId: String,   // store google unique user ID
    provider: String,    // Provider e.g google, facebook, twitter etc
    name: String,
    secret: String   // user secret message
});
// userSchema to use passport local mongoose as a plugin
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

// Create user Model
const User = mongoose.model("User", userSchema);

// CHANGE: USE "createStrategy" INSTEAD OF "authenticate"
// Use passport local mongoose to create a local login strategy and set a passport to  serialize deserialize our user
passport.use(User.createStrategy());
//passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    cb(null, { id: user.id, username: user.username });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});

//////////// Configure Google Authentication //////////////////

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",   // Authorised redirect URLS to secret page
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",  // Retreive from user info and not google plus account
    passReqToCallback: true
  },
  // Google sends back a "accesstoken", which allows to get data related to that user and
  //"refreshToken" allow access to dta fpr a longer period of time. while
  //"profile" contains users email, google ID and anything we have access to created from google dev console
  function(request, accessToken, refreshToken, profile, cb) {
    // npm i mongoose-findorcreate before usong the pseudo method
     console.log(profile.provider);   // to log user profile
    // console.log(profile._json.email);
    User.findOrCreate({ googleId: profile.id },
      {email: profile._json.email,
        name: profile._json.given_name,
        provider: profile.provider
      },
      function (err, user) {  // find or create googleID if it doesn't exist
         return cb(err, user);
        });
  }
 )
);

//////////// Configure Twitter Authentication //////////////////

passport.use(new TwitterStrategy({
    consumerKey: process.env.TWITTER_CONSUMER_KEY,
    consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
    callbackURL: "http://www.localhost:3000/auth/twitter/secrets"
  },
  function(token, tokenSecret, profile, cb) {
    //console.log(profile);
    User.findOrCreate({ twitterId: profile.id },
      {name: profile._json.given_name,
        username: profile.username,
        provider: profile.provider
      },
        function (err, user) {
      return cb(err, user);
    });
  }
 )
);

///////////////////////// GET REQUESTS  //////////////////////////////
app.get('/', function(req, res) {
  res.render('home');
});

//////////// Authenticate  Google Requests //////////////////
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email', 'openid'] }),
  function(req, res) {
    // Successful authentication, redirect secrets page.
    res.redirect('/secrets');
});

app.get('/auth/google/secrets',   // The callback string as to match what was specified in Google console Authorised redirect URIs
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

//////////// Authenticate  Google Requests //////////////////

app.get('/auth/twitter',
  passport.authenticate('twitter'),
  function(req, res) {
    // Successful authentication, redirect secrets page.
    res.redirect('/secrets');
});

app.get('/auth/twitter/secrets',
  passport.authenticate('twitter', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
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
  //console.log(req.isAuthenticated());
  //console.log(req.session.cookie.maxAge); // to check session time left
  // Confirm if a user is authenticated before rendering the secrret page
  //console.log(req);
  if (req.isAuthenticated()) {
    const userId = req.user.id;
    User.findById(userId).then(function(foundUser){
      console.log(foundUser);
      res.render('secrets', {usersWithSecrets: foundUser} )
    }).catch(function(err){
      res.redirect("/submit");
      console.log(err);
    });


  }
  else {
    res.redirect("/login");
  }


});

app.get('/submit', function(req, res){
  if (req.isAuthenticated()) {
    res.render("submit");
  } else {
    res.redirect("/login");
  }
});

// check www.passportjs.org/tutorials/password/logout for the documentation
app.get('/logout', function(req, res , next){
  req.logout(function(err){
    if (err) {
      return next(err);
    }
    res.redirect('/');
  });
});
///////////////////////// POST REQUESTS  //////////////////////////////
app.post('/register', function(req, res) {
  User.findOne({email: req.body.username}).then(function(foundRegister){  // check db if an email already exist
    if(!foundRegister){
      User.register(
        {username: req.body.username , email: req.body.username}, req.body.password,
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
    }
  else {
    const errorMessage = "Oops! " + req.body.username + " email already exist"
    console.log(errorMessage);
    res.render('error', {error: errorMessage});
   }
  }).catch(function(err){
    console.log(err);
  });

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

app.post('/submit', function(req, res){
  const secretMessage = req.body.secret;
  const userId = req.user.id;
  //console.log(secretMessage);
  //console.log(userId);
  User.findById(userId).then(function(foundUser){
    if (!foundUser) {
      console.log("err");
    }
    else {
      if (foundUser) {
        foundUser.secret = secretMessage;
        foundUser.save().then(function(){
          res.redirect('/secrets');
        }).catch(function(err){
          console.log(err);
        });
          // console.log(foundUser);
      }
      else {
        res.redirect('/submit');
      }

    }
  }).catch(function(err){
    console.log(err);
    res.redirect('/login');
  });

  res.render('submit', {secretMessageSent: secretMessage});
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
