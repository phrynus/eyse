const axios = require('axios');
const config = require('../config');

module.exports = async function () {
    try {
        for (const [key, value] of Object.entries(config.bin)) {
            // 交易所时间
            await axios(`${value.baseUrl + value.timeUrl}`)
                .then((res) => {
                    value.timeOffset = res.data.serverTime - Date.now();
                })
                .catch((err) => {
                    throw err.response?.data || err.message;
                });

            // 交易所参数
            await axios(`${value.baseUrl + value.exchangeInfoUrl}`)
                .then((res) => {
                    value.exchangeInfo = res.data || {};
                })
                .catch((err) => {
                    throw err.response?.data || err.message;
                });
        }
    } catch (error) {
        throw error;
    }
};
