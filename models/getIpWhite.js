const config = require('../config');
module.exports = function () {
    return function (req, res, next) {
        const xForwardedFor = (req.get('X-Forwarded-For') || '').replace(/:\d+$/, '');
        const ip = xForwardedFor || req.ip;
        req.isIp = config.whitelist.indexOf(ip);
        req.ipx = ip;
        next();
    };
};
