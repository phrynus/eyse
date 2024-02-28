const express = require('express');
const views = require('./views');
const tv = require('./tv');
const database = require('./db');

const router = express();

router.get('/', (req, res) => {
    res.redirect('/v');
});

router.use('/v', views);

router.use('/db', database);
database.use((req, res, next) => {
    var xForwardedFor = (req.get('X-Forwarded-For') || '').replace(/:\d+$/, '');
    var ip = xForwardedFor || req.ip;
    if (config.tv.whiteList.indexOf(ip) === -1) {
        return res.status(403).json({ message: 'Forbidden' });
    }
    next();
});
router.use('/tv', tv);
tv.use((req, res, next) => {
    var xForwardedFor = (req.get('X-Forwarded-For') || '').replace(/:\d+$/, '');
    var ip = xForwardedFor || req.ip;
    if (config.tv.whiteList.indexOf(ip) === -1) {
        logger.warn('[IP]', ip);
        return res.status(403).json({ message: 'Forbidden' });
    }
    next();
});

module.exports = router;
