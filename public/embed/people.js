'use strict';

var people = people || {};

(function () {

  /**
   * Init.
   * @param options
   */
  people.init = function(options) {
    people.baseUrl = options.url || 'http://localhost:3000';

    if (localStorage.getItem('people.info') === null) {
      people.makeRequest('GET', people.baseUrl + '/remote/info/', {}, function (data) {
        var data = JSON.parse(data.responseText);
        if (data.success === true) {
          localStorage.setItem('people.info', JSON.stringify(data.info));
        }
      });
    }

    if (!people.getCookie('people.sid')) {
      localStorage.removeItem('people.user');
    }

    people.userBlock();
    people.loginBlock();
  };

  /**
   * Make AJAX request.
   * @param method
   * @param url
   * @param data
   * @param next
   * @returns {boolean}
   */
  people.makeRequest = function (method, url, data, next) {
    var throb = document.createElement('img');
    throb.src = people.baseUrl + '/media/ajax-pulse.gif';
    throb.style.position = 'absolute';
    document.body.appendChild(throb);
    document.onmousemove = function(e) {
      throb.style.left = e.pageX + 15 + 'px';
      throb.style.top = e.pageY + 'px';
    };

    var httpRequest = new XMLHttpRequest(),
      body = '',
      query = '';

    if (!httpRequest) {
      alert('Giving up :( Cannot create an XMLHTTP instance');
      return false;
    }

    var str = [];
    for (var p in data) {
      if (data.hasOwnProperty(p)) {
        str.push(encodeURIComponent(p) + '=' + encodeURIComponent(data[p]));
      }
    }
    if (method == 'GET') {
      query = str.length > 0 ? '?' + str.join('&') : '';
    }
    else {
      body = str.join('&');

    }

    httpRequest.open(method, url + query, true);
    httpRequest.onreadystatechange = function () {
      if (httpRequest.readyState === 4 && httpRequest.status === 200) {
        next(httpRequest);
        throb.parentNode.removeChild(throb);
      }
    };

    httpRequest.withCredentials = true;
    httpRequest.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    httpRequest.send(body);
  };

  /**
   * Set Cookies.
   * @param cname
   * @param cvalue
   * @param exdays
   */
  people.setCookie = function (name, value, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    var expires = 'expires=' + d.toUTCString();
    document.cookie = name + '=' + value + '; ' + expires;
  };

  /**
   * Get Cookies.
   * @param cname
   * @returns {string}
   */
  people.getCookie = function (name) {
    var name = name + '=';
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return '';
  };

  /**
   * Erase Cookie.
   * @param name
   */
  people.eraseCookie = function (name) {
    people.setCookie(name, '', -1);
  };

  /**
   * Trigger on cookie set or change.
   * @param name
   * @param callback
   * @returns {*}
   */
  people.cookieRegistry = [];
  people.oncookieset = function (name, callback) {
    setTimeout(people.oncookieset, 100);
    if (people.cookieRegistry[name]) {
      if (people.getCookie(name) != people.cookieRegistry[name]) {
        people.cookieRegistry[name] = people.getCookie(name);
        return callback();
      }
    }
    else {
      people.cookieRegistry[name] = people.getCookie(name);
    }
  };

  /**
   * Alerts().
   * @param data
   * @returns {boolean}
   */
  people.alert = function(data, info) {
    info = info || '';
    data = JSON.parse(data.responseText);

    function ele() {
      var wrp = document.querySelector('.ppl-alerts');
      if (wrp) {
        wrp.innerHTML = '<div class="ppl-alert"><div class="ppl-close-btn">&times</div></div>';
        return wrp.querySelector('.ppl-alert');
      }

      return false;
    }

    if (data.success === true) {
      var el = ele();
      if (el) {
        el.classList.add('ppl-info');
        el.innerHTML += '<p>' + info + '</p>'
      }

      return false;
    }
    else {
      var errors = '';
      var errfor = '';
      for (var i = 0, error; error = data.errors[i]; ++i) {
        errors += error + '\n';
      }
      for (var key in data.errfor) {
        errfor += key + ': ' + data.errfor[key] + '\n';
      }

      var el = ele();
      if (el) {
        el.classList.add('ppl-error');
        var err = (errors) ? errors + '\n' : '';
        err += (errfor) ? errfor + '\n' : '';
        el.innerHTML += '<p>' + err + '</p>'
      }

      return true;
    }
  };

  /**
   * After user login process.
   */
  people.login = function (data) {
    // Set cookies.
    people.setCookie('people.sid', data.sid, 14);

    // Save Shallow user to local storage.
    localStorage.setItem('people.user', JSON.stringify(data.user));

    var event = new Event('onlogin');
    document.dispatchEvent(event);

    // Show the logged-in user block.
    people.userBlock();
    people.userProfile();
    people.loginBlockRemove();
  };

  /**
   * Logout current user.
   */
  people.logout = function () {
    people.eraseCookie('people.sid');
    localStorage.removeItem('people.user');

    var event = new Event('onlogout');
    document.dispatchEvent(event);

    people.loginBlock();
    people.userBlockRemove();
    people.userProfileRemove();
  };

  /**
   * Logged-in user block.
   */
  people.userBlock = function () {
    if (people.getCookie('people.sid')) {
      var user = JSON.parse(localStorage.getItem('people.user'));
      if (user) {
        var userBlock = '';
        userBlock += '<div class="ppl-block" id="ppl-user-block">';
        userBlock += '<div><img id="ppl-user-avatar" src="' + user.avatar + '"></div>';
        userBlock += '<span id="ppl-user-name">' + user.username + '</span>';
        userBlock += '<span> | <a class="ppl-to-logout" href="javascript:void(0)">Log Out</a></span>';
        userBlock += '</div>';

        var el = document.getElementById('ppl-user');
        if (el) el.innerHTML = userBlock;
      }
    }
  };

  /**
   * Remove user block.
   */
  people.userBlockRemove = function () {
    var el = document.getElementById('ppl-user-block');
    if (el) el.outerHTML = '';
  };

  /**
   * login/register block.
   */
  people.loginForm = function (socials) {
    var loginHTML = '';
    loginHTML += '<form class="ppl-login">';
    loginHTML += '<div class="ppl-form-field"><input id="ppl-login-name" type="textfield" placeholder="Name"></div>';
    loginHTML += '<div class="ppl-form-field"><input id="ppl-login-pass" type="password" placeholder="Password"></div>';
    loginHTML += '<button id="ppl-login-btn" type="button" name="button-login">Login</button> ';
    loginHTML += '<a class="ppl-to-forgot" href="javascript:void(0)">Forgot password</a>';
    loginHTML += '</form>';
    if (socials && socials.length > 1) {
      loginHTML += '<div>Or login using: </div>';
      for (var i = 0, name; name = socials[i]; ++i) {
        loginHTML += '<a class="ppl-social-login" id="ppl-login-' + name + '" href="javascript:void(0)">' + name.charAt(0).toUpperCase() + name.slice(1) + '</a> ';
      }
    }

    loginHTML += '<div>New here? <a class="ppl-to-register" href="javascript:void(0)">Register</a></div>';
    return loginHTML;
  };

  /**
   * Register form.
   * @param socials
   * @returns {string}
   */
  people.registerForm = function (socials) {
    var registerHTML = '';
    registerHTML += '<form class="ppl-register">';
    registerHTML += '<div class="ppl-form-field"><input id="ppl-register-name" type="textfield" placeholder="Name"></div>';
    registerHTML += '<div class="ppl-form-field"><input id="ppl-register-email" type="text" placeholder="Email"></div>';
    registerHTML += '<div class="ppl-form-field"><input id="ppl-register-pass" type="password" placeholder="Password"></div>';
    registerHTML += '<button id="ppl-register-btn" type="button" name="button-register">Register</button>';
    registerHTML += '</form>';
    registerHTML += '<h4>Or Login with: </h4>';
    for (var i = 0, name; name = socials[i]; ++i) {
      registerHTML += '<a class="ppl-social-login" id="ppl-login-' + name + '" href="javascript:void(0)">' + name.charAt(0).toUpperCase() + name.slice(1) + '</a>';
    }
    registerHTML += '<div>Already a member? <a class="ppl-to-login" href="javascript:void(0)">Login</a></div>';

    return registerHTML;
  };

  /**
   * Forgot password form.
   * @returns {string}
   */
  people.forgotForm = function () {
    var forgotHTML = '';
    forgotHTML += '<form class="ppl-forgot">';
    forgotHTML += '<div class="ppl-form-field"><input id="ppl-forgot-email" type="email" placeholder="Email"></div>';
    forgotHTML += '<button id="ppl-forgot-btn" type="button" name="button-forgot">Send to my mail</button>';
    forgotHTML += '</form>';
    forgotHTML += '<a class="ppl-to-login" href="javascript:void(0)">Back to login</a>';

    return forgotHTML;
  };

  /**
   * Reset forgot password form.
   * @returns {string}
   */
  people.forgotResetForm = function () {
    var forgotResetHTML = '';
    forgotResetHTML += '<form class="ppl-forgot-reset">';
    forgotResetHTML += '<div class="ppl-form-field"><textarea id="ppl-forgot-reset-token" placeholder="Verification Token"></textarea></div>';
    forgotResetHTML += '<div class="ppl-form-field"><input id="ppl-forgot-reset-pass" type="password" placeholder="New Password"></div>';
    forgotResetHTML += '<button id="ppl-forgot-reset-btn" type="button" name="button-forgot-reset">Update Password</button>';
    forgotResetHTML += '</form>';

    return forgotResetHTML;
  };

  /**
   * Remove login block.
   */
  people.loginBlockRemove = function () {
    var el = document.getElementById('ppl-login-block');
    if (el) el.outerHTML = '';
  };

  /**
   * Display login block.
   * @param options
   */
  people.loginBlock = function (options) {
    if (!people.getCookie('people.sid')) {
      options = options || {};
      var form = options.form || 'login';
      var info = JSON.parse(localStorage.getItem('people.info'));
      var socials = info ? info.socials : [];
      var output = '';
      output += '<div class="ppl-block" id="ppl-login-block">';
      output += '<div class="ppl-close-btn">&times</div>';
      output += '<div class="ppl-alerts"></div>';
      switch (form) {
        case 'login':
          output += people.loginForm(socials);
          break;

        case 'register':
          output += people.registerForm(socials);
          break;

        case 'forgot':
          output += people.forgotForm();
          break;

        case 'reset':
          output += people.forgotResetForm();
          break;
      }
      output += '</div>';

      var el = document.getElementById('ppl-login');
      if (el) el.innerHTML = output;
    }
  };

  /**
   * Logged-in user profile.
   */
  people.userProfile = function () {
    var el = document.getElementById('ppl-profile');
    if (el && people.getCookie('people.sid')) {
      people.makeRequest('GET', people.baseUrl + '/remote/profile/', {sid: people.getCookie('people.sid')}, function (data) {
        people.profileBlock(data.responseText);
      });
    }
  };

  /**
   * Display profile block.
   * @param data
   */
  people.profileBlock = function (data) {
    if (people.getCookie('people.sid')) {
      var user = JSON.parse(localStorage.getItem('people.user'));
      if (user) {
        data = JSON.parse(data);
        var output = '';
        output += '<div class="ppl-block" id="ppl-profile-block">';
        output += '<div class="ppl-close-btn">&times</div>';
        output += '<div class="ppl-alerts"></div>';

        if (data && data.html) {
          output += data.html;
        }

        output += '</div>';
        var el = document.getElementById('ppl-profile');
        if (el) el.innerHTML = output;
      }
    }
  };

  /**
   * Remove profile block.
   */
  people.userProfileRemove = function () {
    var el = document.getElementById('ppl-profile-block');
    if (el) el.outerHTML = '';
  };

  /**
   * Receive message from popup.
   * @param event
   */
  people.receiveMessage = function (event) {
    //window.removeEventListener('message', receiveMessage, false);
    if (event.origin !== people.baseUrl) {
      return;
    }

    people.login(event.data);
  };

  /**
   * Events.
   */
  document.addEventListener('click', function (e) {

    // Elements ID
    switch (e.target.id) {

      case 'ppl-login-btn':
        people.makeRequest('POST', people.baseUrl + '/remote/login/', {
          username: document.getElementById('ppl-login-name').value,
          password: document.getElementById('ppl-login-pass').value
        }, function (data) {
          if (!people.alert(data)) {
            people.login(JSON.parse(data.responseText));
          }
        });
        break;

      case 'ppl-register-btn':
        people.makeRequest('POST', people.baseUrl + '/remote/signup/', {
          username: document.getElementById('register-name').value,
          email: document.getElementById('ppl-register-email').value,
          password: document.getElementById('ppl-register-pass').value
        }, function (data) {
          if (!people.alert(data)) {
            people.login(JSON.parse(data.responseText));
          }
        });
        break;

      case 'ppl-forgot-btn':
        people.makeRequest('POST', people.baseUrl + '/remote/forgot/', {
          email: document.getElementById('ppl-forgot-email').value
        }, function (data) {
          if (!people.alert(data)) {
            people.loginBlock({form: 'reset'});
          }
        });
        break;

      case 'ppl-forgot-reset-btn':
        people.makeRequest('POST', people.baseUrl + '/remote/forgot/reset/', {
          token: document.getElementById('ppl-forgot-reset-token').value,
          password: document.getElementById('ppl-forgot-reset-pass').value
        }, function (data) {
          if (!people.alert(data)) {
            var event = new Event('onpasswordreset');
            document.dispatchEvent(event);
            people.loginBlock();
          }
        });
        break;

      case 'ppl-update-profile-btn':
        var elms = document.querySelectorAll('form#profile input');
        var values = {sid: people.getCookie('people.sid')};
        for (var i = 0, el; el = elms[i]; ++i) {
          values[el.name] = el.value;
        }
        people.makeRequest('POST', people.baseUrl + '/remote/profile/', values, function (data) {
          if (!people.alert(data)) {
            var event = new Event('onprofileupdate');
            document.dispatchEvent(event);
            people.profileBlock(data.responseText);
          }
        });
        break;

      case 'ppl-update-password-btn':
        var elms = document.querySelectorAll('form#password input');
        var values = {sid: people.getCookie('people.sid')};
        for (var i = 0, el; el = elms[i]; ++i) {
          values[el.name] = el.value;
        }
        people.makeRequest('POST', people.baseUrl + '/remote/password/', values, function (data) {
          if (!people.alert(data)) {
            var event = new Event('onpasswordupdate');
            document.dispatchEvent(event);
            people.profileBlock(data.responseText);
          }
        });
        break;

      case 'ppl-user-avatar':
      case 'ppl-user-name':
        people.userProfile();
        break;
    }

    // Elements Class
    switch (e.target.className) {

      case 'ppl-social-login':
        var name = e.target.id.replace('login-', '');

        var url = people.baseUrl + '/remote/signup/' + name + '/',
          width = 1000,
          height = 650,
          top = (window.outerHeight - height) / 2,
          left = (window.outerWidth - width) / 2;
        window.open(url, '', 'width=' + width + ',height=' + height + ',scrollbars=0,top=' + top + ',left=' + left);

        window.addEventListener('message', people.receiveMessage, false);
        break;

      case 'ppl-to-login':
        people.loginBlock();
        break;

      case 'ppl-to-register':
        people.loginBlock({form: 'register'});
        break;

      case 'ppl-to-forgot':
        people.loginBlock({form: 'forgot'});
        break;

      case 'ppl-to-logout':
        people.logout();
        break;

      case 'ppl-verify-email':
        people.makeRequest('POST', people.baseUrl + '/remote/verification/', {}, function (data) {
          var message = 'A verification mail sent to your email address.'
          if (!people.alert(data, message)) {
            // Wait.
          }
        });
        break;

      case 'ppl-close-btn':
        var parent = e.target.parentNode;
        if (parent) parent.outerHTML = '';
        break;

      case 'ppl-change-password':
        var el = document.getElementById('ppl-new-password');
        if (el) el.classList.toggle('hidden');
        break;
    }
  });
})();