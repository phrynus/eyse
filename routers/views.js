const express = require('express');
const logger = require('../lib/logger');
const views = express();

views.use('/', express.static('./views'));

module.exports = views;
