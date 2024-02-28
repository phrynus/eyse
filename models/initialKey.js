const config = require('../config');
const getToken = require('./getToken');
const { BinanaceApi } = require('../lib/client');
const logger = require('../lib/logger');
module.exports = async function () {
    try {
        config.key = config.key.reduce((tokens, item) => {
            const token = getToken(item.key, item.secret);
            tokens[token] = item;
            if (item.exchange === 'binance') {
                item.newBin = new BinanaceApi(item);
            }
            item.token = token;
            return tokens;
        }, {});
        // 循环测试交易所连接成功
        for (const [key, value] of Object.entries(config.key)) {
            if (value.exchange === 'binance') {
                await value.newBin
                    .req('GET', '/fapi/v2/balance', {}, true)
                    .catch((error) => {
                        // 失败的话删除key
                        delete config.key[key];
                        logger.error(`[${value.name}] - ${error}`);
                    })
                    .then((result) => {
                        logger.trace(`[${value.name}] - ${result}`);
                        if (config.safeDouble) {
                            value.newBin.req('POST', '/fapi/v1/positionSide/dual', { dualSidePosition: 'true' }, true);
                        }
                    });
            }
        }
        if (Object.keys(config.key).length === 0) {
            throw new Error('No key');
        }
        config.tv.model.tokens = Object.keys(config.key);
    } catch (error) {
        throw new Error(error);
    }
};
