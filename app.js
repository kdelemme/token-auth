var express = require('express');
var app = express();
var bodyParser = require('body-parser'); //bodyparser + json + urlencoder
var morgan  = require('morgan'); // logger
var redis = require('redis');
var redisClient = redis.createClient();
var PORT = 3001;

//Configuration
app.listen(PORT);
app.use(bodyParser());
app.use(morgan());


var auth = require('./index').auth(redisClient, {ttl:60*60*24, tokenLength:32});


app.all('*', function(req, res, next) {
	res.set('Access-Control-Allow-Origin', 'http://localhost');
	res.set('Access-Control-Allow-Credentials', true);
	res.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, PUT');
	res.set('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type');
	if ('OPTIONS' == req.method) return res.send(200);
	next();
});

app.get('/signin', function(req, res) {

	//verify credential (use POST)

	//build userData to store with the token
	var userData = {id:1, firstname: 'John', lastname: 'Doe'};

	auth.createAndStoreToken(userData, 60*60*5, function(err, token) {
		if (err) {
			console.log(err);

			return res.send(400);
		} 

		//Send back token
		return res.send(200, token);
	});
});

app.get('/protected', auth.verifyToken, function(req, res) {
	if (req._user) {
		console.log(req._user);
		return res.send(200, req._user);
	}
});


app.get('/expire', function(req, res) {

	auth.expireToken(req.headers, function(err, success) {
		if (err) {
			console.log(err);
			return res.send(401);
		}

		if (success) res.send(200);
		else res.send(401);
	});
});
