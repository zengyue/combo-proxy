'use strict';

var connect = require('connect'),
  http = require('http'),
  comboProxy = require('./index');

var app = connect()
  .use(comboProxy({root: __dirname}));

http.createServer(app).listen(8000);