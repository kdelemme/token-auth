var redis = require('redis'); 
var redisClient = redis.createClient(); 
var assert = require('assert');


var options = {
	ttl: 60*60*24,
	tokenLength: 32,
	debug: true
};

var auth = require('../index').auth(redisClient, options);


// tests

describe('Create and Store a Token with Data', function() {

	it ('should generate a token of 32*2 chars length', function() {
		auth.createAndStoreToken({}, function(err, token) {
			assert.equal(32*2, token.length);
		});
	});

	it ('should throw an Error if data is not a valid object', function() {
		
		assert.throws(
			function() { 
				auth.createAndStoreToken(null, function(err) {
					throw err;
				}); 
			}, 
			function(err) {
				if ((err instanceof Error) && /data is not a valid Object/.test(err)) {
					return true;
				}
			}
		);

		assert.throws(
			function() { auth.createAndStoreToken(undefined, function(err) {
					throw err;
				}); 
			},
			function(err) {
				if ((err instanceof Error) && /data is not a valid Object/.test(err)) {
					return true;
				}
			}
		);

		assert.throws(
			function() { auth.createAndStoreToken("", function(err) {
					throw err;
				}); 
			},
			function(err) {
				if ((err instanceof Error) && /data is not a valid Object/.test(err)) {
					return true;
				}
			}
		);
	});
});