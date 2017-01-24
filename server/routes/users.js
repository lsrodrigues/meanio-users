'use strict';

var config = require('meanio').loadConfig();
var jwt = require('jsonwebtoken'); //https://npmjs.org/package/node-jsonwebtoken

module.exports = function(MeanUser, app, auth, database, passport) {

  // User routes use users controller
  var users = require('../controllers/users')(MeanUser);

  app.use(users.loadUser);

  app.route('/api/logout')
    .get(users.signout);
  app.route('/api/users/me')
    .get(users.me);

  // Setting up the userId param
  app.param('userId', users.user);

  // AngularJS route to check for authentication
  app.route('/api/loggedin').get(users.loggedin);

  if(config.strategies.local.enabled)
  {
      // Setting up the users api
      app.route('/api/register')
        .post(users.create);

      app.route('/api/update')
        .put(users.update); 

      app.route('/api/forgot-password')
        .post(users.forgotpassword);

      app.route('/api/reset/:token')
        .post(users.resetpassword);
      
      app.route('/api/change')
        .post(users.changepassword);

      // Setting the local strategy route
      app.route('/api/login')
        .post(passport.authenticate('local', {
          failureFlash: false
        }), function(req, res) {      
          var payload = req.user;
          payload.redirect = req.body.redirect;
          var escaped = JSON.stringify(payload);      
          escaped = encodeURI(escaped);
          // We are sending the payload inside the token
          var token = jwt.sign(escaped, config.secret);
          MeanUser.events.publish({
            action: 'logged_in',
            user: {
                name: req.user.name
            }
          });
          res.json({
            token: token,
            redirect: config.strategies.landingPage
          });
        });
  }

  // AngularJS route to get config of social buttons
  app.route('/api/get-config')
    .get(function (req, res) {
      // To avoid displaying unneccesary social logins
      var strategies = config.strategies;
      var configuredApps = {};
      for (var key in strategies)
      {
        if(strategies.hasOwnProperty(key))
        {
          var strategy = strategies[key];
          if (strategy.hasOwnProperty('enabled') && strategy.enabled === true) {
            configuredApps[key] = true ;
          }
        }
      }
      res.send(configuredApps);
    });

  if(config.strategies.facebook.enabled)
  {
      // Setting the facebook oauth routes
      app.route('/api/auth/facebook')
        .get(passport.authenticate('facebook', {
          scope: ['email', 'user_about_me'],
          failureRedirect: '/auth/login',
        }), users.signin);

      app.route('/api/auth/facebook/callback')
        .get(passport.authenticate('facebook', {
          failureRedirect: '/auth/login',
        }), users.authCallback);
  }

  if(config.strategies.github.enabled)
  {
      // Setting the github oauth routes
      app.route('/api/auth/github')
        .get(passport.authenticate('github', {
          failureRedirect: '/auth/login'
        }), users.signin);

      app.route('/api/auth/github/callback')
        .get(passport.authenticate('github', {
          failureRedirect: '/auth/login'
        }), users.authCallback);
  }

  if(config.strategies.twitter.enabled)
  {    
      // Setting the twitter oauth routes
      app.route('/api/auth/twitter')
        .get(passport.authenticate('twitter', {
          failureRedirect: '/auth/login'
        }), users.signin);

      app.route('/api/auth/twitter/callback')
        .get(passport.authenticate('twitter', {
          failureRedirect: '/auth/login'
        }), users.authCallback);
  }

  if(config.strategies.google.enabled)
  {
      // Setting the google oauth routes
      app.route('/api/auth/google')
        .get(passport.authenticate('google', {
          failureRedirect: '/auth/login',
          scope: [
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email'
          ]
        }), users.signin);

      app.route('/api/auth/google/callback')
        .get(passport.authenticate('google', {
          failureRedirect: '/auth/login'
        }), users.authCallback);
  }

  if(config.strategies.linkedin.enabled)
  {
      // Setting the linkedin oauth routes
      app.route('/api/auth/linkedin')
        .get(passport.authenticate('linkedin', {
          failureRedirect: '/auth/login',
          scope: ['r_emailaddress']
        }), users.signin);

      app.route('/api/auth/linkedin/callback')
        .get(passport.authenticate('linkedin', {
          failureRedirect: '/auth/login'
        }), users.authCallback);
  }

};
