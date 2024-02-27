const express = require('express');
const views = express();

views.use('/', express.static('./views'));

module.exports = views;
