/**
 * Module dependencies.
 */
var util = require('util')
  , OAuth2Strategy = require('passport-oauth2')
  , InternalOAuthError = require('passport-oauth2').InternalOAuthError;


/**
 * `Strategy` constructor.
 *
 * The Instagram authentication strategy authenticates requests by delegating to
 * Instagram using the OAuth 2.0 protocol.
 *
 * Applications must supply a `verify` callback which accepts an `accessToken`,
 * `refreshToken` and service-specific `profile`, and then calls the `done`
 * callback supplying a `user`, which should be set to `false` if the
 * credentials are not valid.  If an exception occured, `err` should be set.
 *
 * Options:
 *   - `clientID`      your Instagram application's client id
 *   - `clientSecret`  your Instagram application's client secret
 *   - `callbackURL`   URL to which Instagram will redirect the user after granting authorization
 *
 * Examples:
 *
 *     passport.use(new InstagramStrategy({
 *         clientID: '123-456-789',
 *         clientSecret: 'shhh-its-a-secret'
 *         callbackURL: 'https://www.example.net/auth/instagram/callback'
 *       },
 *       function(accessToken, refreshToken, profile, done) {
 *         User.findOrCreate(..., function (err, user) {
 *           done(err, user);
 *         });
 *       }
 *     ));
 *
 * @param {Object} options
 * @param {Function} verify
 * @api public
 */
function Strategy(options, verify) {
  options = options || {};
  options.authorizationURL = options.authorizationURL || 'https://api.instagram.com/oauth/authorize/';
  options.tokenURL = options.tokenURL || 'https://api.instagram.com/oauth/access_token';

  OAuth2Strategy.call(this, options, verify);
  this.name = 'instagram';
  this._profileURL = 'https://graph.instagram.com/me?fields=id,username';
}

/**
 * Inherit from `OAuth2Strategy`.
 */
util.inherits(Strategy, OAuth2Strategy);


/**
 * Retrieve user profile from Instagram.
 *
 * This function constructs a normalized profile, with the following properties:
 *
 *   - `provider`         always set to `instagram`
 *   - `id`               the user's Instagram ID
 *   - `username`         the user's Instagram username
 *   - `displayName`      the user's full name
 *
 * @param {String} accessToken
 * @param {Function} done
 * @api protected
 */
Strategy.prototype.userProfile = function (accessToken, done) {
  // TODO: Instagram provides user profile information in the access token
  //       response.  As an optimization, that information should be used, which
  //       would avoid the need for an extra request during this step.  However,
  //       the internal node-oauth module will have to be modified to support
  //       exposing this information.
  var profileUrl = this._profileURL;
  this._oauth2.get(profileUrl, accessToken, function (err, body, res) {
    if (err) {
      console.log(`_oauth2.get(..) error at [${profileUrl}] with accessToken [${accessToken}]`)
      console.log(errorToString(err));
      console.log(`error body:`);
      console.log(`${body}`);
      console.log(body);
      console.log(`error res`);
      console.log(res);
      return done(new InternalOAuthError('failed to fetch user profile', err));
    }

    try {
      var json = JSON.parse(body);

      var profile = { provider: 'instagram' };
      profile.id = json.id;
      profile.username = json.username;

      profile._raw = body;
      profile._json = json;

      done(null, profile);
    } catch (e) {
      done(e);
    }
  });
}
/**
 * Expose `Strategy`.
 */
module.exports = Strategy;

function errorToString(error) {
  if (error == null) {
    return `(error is ${error})`;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (Array.isArray(error)) {
    // list of nested errors
    return error.reduce((agg, c) => {
      const s = stringify(c);
      return agg + s + '.\n';
    }, '').trim()//.replace(/\n/g, '<br />');
  }
  if (error.message) {
    return error.message + '\n' + error.stack;
  }

  return `${error}`;
}

function stringify(mix) {
  var type = typeof mix;
  if (type === 'string') {
    return mix;
  } else if (isError(mix)) {
    return [mix.message, mix.stack].join('\n');
  } else {
    return `${mix}`;
  }
}

function isError(e) {
  return e && e.stack;
}