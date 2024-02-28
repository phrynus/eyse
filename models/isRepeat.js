const config = require('../config');
module.exports = function isRepeat(params) {
    const time = new Date();
    const filteredTrades = config.safeRepeatList.filter((trade) => trade.time > time - 1000 * 60 * 1);

    // filteredTrades 里面是否有重复的交易
    const hasRepeat = filteredTrades.some((trade) => {
        return JSON.stringify(trade.params) == JSON.stringify(params);
    });
    // console.log(filteredTrades, hasRepeat);

    if (!hasRepeat) {
        config.safeRepeatList.unshift({ time, params });
        return false;
    } else if (config.safeRepeatList.length > 1000) {
        config.safeRepeatList.pop();
    }
    return true;
};
