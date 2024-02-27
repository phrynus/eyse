const config = require('../config');
module.exports = function isRepeat(params) {
    const time = new Date();
    const filteredTrades = config.safeRepeatList.filter((trade) => trade.time > time - 1000 * 60 * 1);
    if (filteredTrades.length < 1) {
        config.safeRepeatList.unshift({ time, params });
        return false;
    } else if (config.safeRepeatList.length > 1000) {
        config.safeRepeatList.pop();
    }
    return true;
};
