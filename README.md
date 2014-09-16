# Token-based Authentication


## Description

Token-Auth is a Token-based Authentication system. It generates token and stores them in redis with user informations. It verifies provided token from HTTP Header (Authorization) in order to allow access to protected end point api.


## Installation

Get the sources:
```bash
git clone https://github.com/kdelemme/nodejs-token-auth.git
```

### NodeJS

In order to start the nodejs server, we need express and node_redis dependencies.

Install the nodejs dependencies:
```bash
kevin@home$ npm install
```

Start the server:
```bash
kevin@home$ node app.js
```

## Usage

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
