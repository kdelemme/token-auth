var crypto = require('crypto');

exports.auth = function(redisClient, options) {

	/*
	 * options: Object
	 * options.ttl = time to live in secondes during when a token is valid
	 * options.tokenLength = number of hex char in a token
	 */
	var _options = options;

	/*
	 * redisClient: Object
	 * represents a already configured redisClient
	 */
	var _redisClient = redisClient;


	/*
	 * TokenHelper
	 */
	var tokenHelper = (function() {
		var TOKEN_LENGTH = _options.tokenLength || 32;

		return {
			/*
			* Create a 32 bytes token - ASYNC
			* callback(err, token) 
			*/
			createToken: function(callback) {
				crypto.randomBytes(TOKEN_LENGTH, function(ex, token) {
					if (ex) callback(ex);

					if (token) callback(null, token.toString('hex'));
					else callback(new Error('Problem when generating token'));
				});
			},

			/*
			* Extract the token from the header Authorization.
			* Authorization: TOKEN-MECHANISM Token
			* Returns the token
			*/
			extractTokenFromHeader: function(headers) {
				if (headers == null) throw new Error('Header is null');
				if (headers.authorization == null) throw new Error('Authorization header is null');

				var authorization = headers.authorization;
				var authArr = authorization.split(' ');
				if (authArr.length != 2) throw new Error('Authorization header value is not of length 2');

				// retrieve token
				var token = authArr[1]; 
				if (token.length != TOKEN_LENGTH * 2) throw new Error('Token length is not the expected one');

				return token;
			}
		};
	})();


	var redisHelper = (function() {

		return {
			/*
			* Stores a token with user data for a ttl period of time
			* token: String - Token used as the key in redis 
			* data: Object - value stored with the token 
			* ttl: Number - Time to Live in seconds (default: 24Hours)
			* callback: Function
			*/
			setTokenWithData: function(token, data, ttl, callback) {
				if (token == null) throw new Error('Token is null');
				if (data != null && typeof data !== 'object') throw new Error('data is not an Object');

				var userData = data || {};
				userData._ts = new Date();

				var timeToLive = ttl || _options.ttl;
				if (timeToLive != null && typeof timeToLive !== 'number') throw new Error('TimeToLive is not a Number');


				redisClient.setex(token, timeToLive, JSON.stringify(userData), function(err, reply) {
					if (err) callback(err);

					if (reply) {
						callback(null, true);
					} else {
						callback(new Error('Token not set in redis'));
					}
				});
			},

			/*
			* Gets the associated data of the token.
			* token: String - token used as the key in redis
			* callback: Function - returns data
			*/
			getDataByToken: function(token, callback) {
				if (token == null) callback(new Error('Token is null'));

				redisClient.get(token, function(err, userData) {
					if (err) callback(err);

					if (userData != null) callback(null, JSON.parse(userData));
					else callback(new Error('Token Not Found'));
				});
			},

			/*
			* Expires a token by deleting the entry in redis
			* callback(null, true) if successfuly deleted
			*/
			expireToken: function(token, callback) {
				if (token == null) callback(new Error('Token is null'));

				redisClient.del(token, function(err, reply) {
					if (err) callback(err);

					if (reply) callback(null, true);
					else callback(new Error('Token not found'));
				});
			}
		};
	})();

	return {
		verifyToken: function(req, res, next) {
			var headers = req.headers;
			if (headers == null) return res.send(401);

			// Get token
			try {
				var token = tokenHelper.extractTokenFromHeader(headers);
			} catch (err) {
				console.log(err);
				return res.send(401);
			}

			//Verify it in redis, set data in req._user
			redisHelper.getDataByToken(token, function(err, data) {
				if (err) return res.send(401);

				req._user = data;

				next();
			});
		},

		createAndStoreToken: function(data, ttl, callback) {
			data = data || {};
			ttl = ttl || _options.ttl;

			if (data != null && typeof data !== 'object') callback(new Error('data is not an Object'));
			if (ttl != null && typeof ttl !== 'number') callback(new Error('ttl is not a valid Number'));

			tokenHelper.createToken(function(err, token) {
				if (err) callback(err);

				redisHelper.setTokenWithData(token, data, ttl, function(err, success) {
					if (err) callback(err);

					if (success) {
						callback(null, token);
					}
					else {
						callback(new Error('Error when saving token'));
					}
				});
			});
		},

		expireToken: function(headers, callback) {
			if (headers == null) callback(new Error('Headers are null'));

			// Get token
			try {
				var token = tokenHelper.extractTokenFromHeader(headers);

				if (token == null) callback(new Error('Token is null'));

				redisHelper.expireToken(token, callback);
			} catch (err) {
				console.log(err);
				return callback(err);
			}	
		}
	};
};