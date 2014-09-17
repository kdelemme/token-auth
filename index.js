var crypto = require('crypto');

exports.auth = function(redisClient, options) {

	var _defaultOptions = {ttl:60*60*24, tokenLength: 32, debug: false};

	/*
	 * options: Object
	 * options.ttl = time to live in secondes during when a token is valid
	 * options.tokenLength = number of hex char in a token
	 * options.debug = active or deactive the debug mode
	 */
	var _options = {};

	if (options == null) {
		_options = _defaultOptions;
	} 
	else {
		if (options.ttl != null && typeof options.ttl !== 'number') {
			throw new Error('options.ttl is not a Number');
		}
		if (options.tokenLength != null && typeof options.tokenLength !== 'number') {
			throw new Error('options.tokenLength is not a Number');
		}
		if (options.debug != null && typeof options.debug !== 'boolean') {
			throw new Error('options.debug is not a Boolean');
		}

		_options.ttl = options.ttl || _defaultOptions.ttl;
		_options.tokenLength = options.tokenLength || _defaultOptions.tokenLength;
		_options.debug = options.debug || _defaultOptions.debug;
	}

	/*
	 * TokenHelper
	 */
	var tokenHelper = (function() {

		var TOKEN_LENGTH = _options.tokenLength;

		return {
			/*
			 * Creates a random token
			 * @param {Function} callback(err, token): generated token 
			 */
			createToken: function(callback) {
				crypto.randomBytes(TOKEN_LENGTH, function(ex, token) {
					if (ex) {
						callback(ex);
					}

					if (token) {
						callback(null, token.toString('hex'));
					}
					else {
						callback(new Error('Problem when generating token'));
					}
				});
			},

			/*
			 * Extract the token from the header Authorization.
			 * Authorization: TOKEN-MECHANISM Token
			 * @param {Object} headers: the headers from express request object
			 * returns the token
			 */
			extractTokenFromHeader: function(headers) {
				if (headers == null) {
					throw new Error('Header is null');
				}
				if (headers.authorization == null) {
					throw new Error('Authorization header is null');
				}

				var authorization = headers.authorization;
				var authArr = authorization.split(' ');
				if (authArr.length != 2) {
					throw new Error('Authorization header value is not of length 2');
				}

				// retrieve token
				var token = authArr[1]; 
				if (token.length != TOKEN_LENGTH * 2) {
					throw new Error('Token length is not the expected one');
				}

				return token;
			}
		};
	})();


	var redisHelper = (function() {

		var TTL = _options.ttl;

		return {
			/*
			 * Stores a token with user data for a TTL period of time
			 * @param {String} token: Token used as the key in redis 
			 * @param {Object} data: value stored with the token 
			 * @param {Function} callback(err, boolean): true if data successfully set in redis with token
			 */
			setTokenWithData: function(token, data, callback) {
				if (token == null) { 
					throw new Error('Token is null');
				}
				if (data != null && typeof data !== 'object') {
					throw new Error('data is not an Object');
				}

				var _data = data || {};
				_data._ts = new Date();

				redisClient.setex(token, TTL, JSON.stringify(_data), function(err, reply) {
					if (err) {
						callback(err);	
					}

					if (reply) {
						callback(null, true);
					} else {
						callback(new Error('Token not set in redis'));
					}
				});
			},

			/*
			 * Gets the associated data of the token.
			 * @param {String} token: token used as the key in redis
			 * @param {Function} callback(err, data): returns data
			 */
			getDataByToken: function(token, callback) {
				if (token == null) {
					callback(new Error('Token is null'));
				}

				redisClient.get(token, function(err, data) {
					if (err) {
						callback(err);
					}

					if (data != null) {
						callback(null, JSON.parse(data));
					}
					else { 
						callback(new Error('Token Not Found'));
					}
				});
			},

			/*
			 * Expires a token by deleting the entry in redis
			 * @param {String} token: The token to expire
			 * @param {Function} callback(err, boolean): true if successfully deleted
			 */
			expireToken: function(token, callback) {
				if (token == null) callback(new Error('Token is null'));

				redisClient.del(token, function(err, reply) {
					if (err) {
						callback(err);
					}

					if (reply) {
						callback(null, true);
					}
					else {
						callback(new Error('Token not found'));
					}
				});
			}
		};
	})();

	return {
		/*
		 * Middleware to verify the token and store the user data in req._user
		 * @param {Object} req: express request object
		 * @param {Object} res: express result object
		 * @param {Function} next: express next function 
		 */
		verifyToken: function(req, res, next) {
			var headers = req.headers;
			if (headers == null) return res.send(401);

			// Get token
			try {
				var token = tokenHelper.extractTokenFromHeader(headers);
			} catch (err) {
				if (_options.debug) {
					console.log(err);
				}

				return res.send(401);
			}

			//Verify it in redis, set data in req._user
			redisHelper.getDataByToken(token, function(err, data) {
				if (err) {
					return res.send(401);
				}

				req._user = data;

				next();
			});
		},

		/*
		 * Create a new token, stores it in redis with data during ttl time in seconds
		 * @param {Object} data: Data stores with the token in redis
		 * @param {Function} callback(err, token): returns the token or an error.
		 */
		createAndStoreToken: function(data, callback) {
			if (data == null || (data != null && typeof data !== 'object')) {
				callback(new Error('data is not a valid Object'));
			}

			tokenHelper.createToken(function(err, token) {
				if (err) { 
					callback(err);
				}

				redisHelper.setTokenWithData(token, data, function(err, success) {
					if (err) {
						callback(err);
					}

					if (success) {
						callback(null, token);
					}
					else {
						callback(new Error('Error when saving token'));
					}
				});
			});
		},

		/*
		 * Expires the token (remove from redis)
		 * @param {Object} headers: headers from request.headers
		 * @param {Function} callback(err, boolean): true if successfully deleted from redis
		 */
		expireToken: function(headers, callback) {
			if (headers == null) {
				callback(new Error('Headers are null'));
			}

			// Get token
			try {
				var token = tokenHelper.extractTokenFromHeader(headers);

				if (token == null)  {
					callback(new Error('Token is null'));
				}

				redisHelper.expireToken(token, callback);
			} catch (err) {
				if (_options.debug) {
					console.log(err);
				}
				return callback(err);
			}	
		}
	};
};