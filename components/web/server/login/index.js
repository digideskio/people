'use strict';

var getSocials = function(req) {
  var settings = req.app.getSettings();
  var ret = [];
  req.app.config.socials.forEach(function(social, index, arr) {
    if (!!settings[social + 'Key']) {
      ret.push(social);
    }
  });

  return ret;
};

exports.init = function (req, res) {
  if (req.isAuthenticated()) {
    res.redirect(req.user.defaultReturnUrl());
  }
  else {
    res.render('web/server/login/index', {socials: getSocials(req)});
  }
};

exports.login = function (req, res) {
  var settings = req.app.getSettings();
  var workflow = req.app.utility.workflow(req, res);

  workflow.on('validate', function () {
    if (!req.body.username) {
      workflow.outcome.errfor.username = 'required';
    }

    if (!req.body.password) {
      workflow.outcome.errfor.password = 'required';
    }

    if (workflow.hasErrors()) {
      return workflow.emit('response');
    }

    workflow.emit('abuseFilter');
  });

  workflow.on('abuseFilter', function () {
    var getIpCount = function (done) {
      var conditions = {ip: req.ip};
      req.app.db.models.LoginAttempt.count(conditions, function (err, count) {
        if (err) {
          return done(err);
        }

        done(null, count);
      });
    };

    var getIpUserCount = function (done) {
      var conditions = {ip: req.ip, user: req.body.username};
      req.app.db.models.LoginAttempt.count(conditions, function (err, count) {
        if (err) {
          return done(err);
        }

        done(null, count);
      });
    };

    var asyncFinally = function (err, results) {
      if (err) {
        return workflow.emit('exception', err);
      }

      if (results.ip >= settings.loginAttemptsForIp || results.ipUser >= settings.loginAttemptsForIpAndUser) {
        workflow.outcome.errors.push('You\'ve reached the maximum number of login attempts. Please try again later.');
        return workflow.emit('response');
      }
      else {
        workflow.emit('attemptLogin');
      }
    };

    require('async').parallel({ip: getIpCount, ipUser: getIpUserCount}, asyncFinally);
  });

  workflow.on('attemptLogin', function () {
    req._passport.instance.authenticate('local', function (err, user, info) {
      if (err) {
        return workflow.emit('exception', err);
      }

      if (!user) {
        var fieldsToSet = {ip: req.ip, user: req.body.username};
        req.app.db.models.LoginAttempt.create(fieldsToSet, function (err, doc) {
          if (err) {
            return workflow.emit('exception', err);
          }

          workflow.outcome.errors.push('Username and password combination not found or your account is inactive.');
          return workflow.emit('response');
        });
      }
      else if (typeof user.totp !== 'undefined' && user.totp.length > 0) {
        var payload = {
          id: user.id,
          twostep: 'on'
        };
        var jwt = require('jsonwebtoken');
        var token = jwt.sign(payload, settings.cryptoKey);
        res.cookie(req.app.locals.webJwtName, token);
        workflow.outcome.twostep  = true;
        return workflow.emit('response');
      }
      else {
        req.login(user, {session: false}, function (err) {
          if (err) {
            return workflow.emit('exception', err);
          }

          var methods = req.app.utility.methods;
          var token = methods.setJwt(user, settings.cryptoKey);

          methods.setSession(req, res, token, function(err) {
            if (err) {
              return workflow.emit('exception', err);
            }

            req.hooks.emit('userLogin', user);
            res.cookie(req.app.locals.webJwtName, token);
            workflow.outcome.defaultReturnUrl = user.defaultReturnUrl();
            workflow.emit('response');
          });
        });
      }
    })(req, res);
  });

  workflow.emit('validate');
};