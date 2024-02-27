const mongoose = require('mongoose');
const config = require('../config');
mongoose.connect(config.mongoose.url);

module.exports = mongoose;
