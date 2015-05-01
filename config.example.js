'use strict';

exports.port = process.env.PORT || 3000;
exports.ip = process.env.IP || '127.0.0.1';
exports.mongodb = {
  uri: process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'localhost/people'
};
exports.companyName = 'People, Inc.';
exports.projectName = 'People';
exports.systemEmail = 'your@email.com';// Changes this.
exports.cryptoKey = 'k3yb0ardc4t';// Changes this.
exports.public_key = 'pk_BDBFEA65CB85DC41FF9E928E7886C';// Changes this.
exports.secret_key = 'sk_A6D8FC87413B789E4E9E86FAC43A2';// Changes this.
exports.loginAttempts = {
  forIp: 50,
  forIpAndUser: 7,
  logExpiration: '20m'
};
exports.webhooksURL = ''; //'http://people.lh/webhooks';
exports.allowDomain = 'http://people.lh';
exports.csrfExclusion = ['/remote/','/api/'];
exports.requireAccountVerification = false;
exports.smtp = {
  from: {
    name: process.env.SMTP_FROM_NAME || exports.projectName +' Website',
    address: process.env.SMTP_FROM_ADDRESS || 'your@email.com'// Changes this.
  },
  credentials: {
    user: process.env.SMTP_USERNAME || 'your@email.com',// Changes this.
    password: process.env.SMTP_PASSWORD || 'bl4rg!',// Changes this.
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    ssl: true
  }
};

// Social login apps details.
exports.oauth = {
  twitter: {
    key: process.env.TWITTER_OAUTH_KEY || '',
    secret: process.env.TWITTER_OAUTH_SECRET || ''
  },
  facebook: {
    key: process.env.FACEBOOK_OAUTH_KEY || '',
    secret: process.env.FACEBOOK_OAUTH_SECRET || ''
  },
  github: {
    key: process.env.GITHUB_OAUTH_KEY || '',
    secret: process.env.GITHUB_OAUTH_SECRET || ''
  },
  google: {
    key: process.env.GOOGLE_OAUTH_KEY || '',
    secret: process.env.GOOGLE_OAUTH_SECRET || ''
  },
  tumblr: {
    key: process.env.TUMBLR_OAUTH_KEY || '',
    secret: process.env.TUMBLR_OAUTH_SECRET || ''
  }
};

// Extra user fields.
exports.fields = [
  {key: 'firstName', name: 'First Name'},
  {key: 'lastName', name: 'Last Name'}
];

// user 1 (master) ID.
// Can not be update or delete form the UI. Only straight form the DB.
exports.uid1 = '';