const axios = require('axios');
const config = require('../config');
const db = require('../lib/db');
const { BinanaceApi } = require('../lib/client');
const logger = require('../lib/logger');
const getToken = require('./getToken');

module.exports = async function () {
    try {
        // 初始化交易所数据
        // for (const [key, value] of Object.entries(config.bin)) {
        //     // 交易所时间
        //     await axios(`${value.baseUrl + value.timeUrl}`)
        //         .then((res) => {
        //             value.timeOffset = res.data.serverTime - Date.now();
        //         })
        //         .catch((err) => {
        //             throw err.response?.data || err.message;
        //         });

        //     // 交易所参数
        //     await axios(`${value.baseUrl + value.exchangeInfoUrl}`)
        //         .then((res) => {
        //             value.exchangeInfo = res.data || {};
        //         })
        //         .catch((err) => {
        //             throw err.response?.data || err.message;
        //         });
        // }
        // 取KEy
        const keyModelNum = await db.KeyModel.find().count();
        let keys = [];
        while (keys.length < keyModelNum) {
            let k = await db.KeyModel.find()
                .batchSize(keys.length)
                .limit(keyModelNum > keys.length + 500 ? 500 : keyModelNum - keys.length);
            keys = keys.concat(k);
        }
        if (keys.length > 0) {
            config.key = await keys.reduce(async (tokens, items) => {
                const item = { ...items._doc };
                if (item.token == '') {
                    item.token = getToken(item.key, item.secret);
                }
                if (item.exchange === 'binance') {
                    item.newBin = new BinanaceApi(item);
                }
                tokens[item.token] = item;
                await db.KeyModel.updateOne(
                    { _id: item._id },
                    {
                        $set: { token: item.token },
                    }
                );
                return tokens;
            }, {});
        } else {
            config.key = {};
        }
    } catch (error) {
        throw error;
    }
};
