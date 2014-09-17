# auth-token


## Description

Auth-token is a Token-based Authentication module. It generates tokens and stores them in redis with user informations. It verifies the provided token from HTTP Header (Authorization) in order to allow access to a protected end point api throught a middleware.

## Requirements

Works with `redis` and `nodejs`.

## Installation

Get the sources:
```bash
npm install --save-dev token-io
```

## Tests

```bash
kevin@home$ mocha test/test.js
```

## Usage

```javascript
var redis = require('redis'); 
var redisClient = redis.createClient(); 

var options = {
	ttl: 60*60*24,
	tokenLength: 32,
	debug: true
};

var auth = require('token-io').auth(redisClient, options);

app.get('/signin', function(req, res) {

	// verify credential (use POST)

	// build userData to store with the token
	var userData = {id:1, firstname: 'John', lastname: 'Doe'};

	auth.createAndStoreToken(userData, function(err, token) {
		if (err) {
			console.log(err);

			return res.send(400);
		} 

		// Send back token
		return res.send(200, token);
	});
});

app.get('/protected', auth.verifyToken, function(req, res) {
	if (req._user) {
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
	}
};
```

### Generates a token and stores it
```bash
kevin@home$ curl http://localhost:3001/signin
```

This send back the generated token for later usage.

### Access protected endpoint
```bash
kevin@home$ curl --header 'Authorization: AUTH Generated_Token' http://localhost:3001/protected
```

### Expire a token
```bash
kevin@home$ curl --header 'Authorization: AUTH Generated_Token' http://localhost:3001/expire
```

## Stack

* Node.js
* Redis

## Licence
The MIT License (MIT)

Copyright (c) 2014 Kevin Delemme (kdelemme@gmail.com)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
