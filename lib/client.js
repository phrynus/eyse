const crypto = require('crypto');
const axios = require('axios');
const logger = require('./logger');
const config = require('../config');

// Binanace API
class BinanaceApi {
    constructor(keys) {
        if (keys.key == false || keys.secret == false) {
            throw new Error('API key and secret are required');
        }
        this.key = keys.key;
        this.secret = keys.secret;
        // 拼接对象
        Object.assign(this, config.bin.binance);
    }
    req(method, url, params, isPrivate = false) {
        const timeOn = new Date();
        // 设置请求参数
        // params.recvWindow = this.recvWindow;
        params.timestamp = Date.now() + (this.timeOffset || 0);
        const serialisedParams = Object.entries(params)
            .map(([key, value]) => `${key}=${value}`)
            .join('&');
        const signature = crypto.createHmac('sha256', this.secret).update(serialisedParams).digest('hex');
        const options = {
            method: method,
            url: `${this.baseUrl + url}?${serialisedParams}${isPrivate ? `&signature=${signature}` : ''}`,
            headers: {
                'X-MBX-APIKEY': this.key,
            },
            // json: true, // 指定请求返回JSON格式的数据
            // timeout: 1000,
        };
        // 发送请求
        return axios(options)
            .then((res) => {
                if (res.status == 200) {
                    logger.trace('[binance]', `${new Date() - timeOn}ms`, method, url, `${JSON.stringify(params)} => ${res?.data?.code || res?.status}`);
                    return res.data; // 返回响应数据
                }
                throw res; // 抛出错误
            })
            .catch((err) => {
                if (err.response?.data?.msg == 'Timestamp for this request is outside of the recvWindow.') {
                    logger.trace('[binance][重发]', `${new Date() - timeOn}ms`, method, url, `${JSON.stringify(params)} =>${err.response?.data?.code || err.response?.status} ${err.response?.data?.msg || err.message}`);
                    return this.req(method, url, params, isPrivate);
                } else if (err.message == `timeout of ${options.timeout}ms exceeded`) {
                    logger.trace('[binance][重发]', `${new Date() - timeOn}ms`, method, url, `${JSON.stringify(params)} => ${err.response?.data?.msg || err.message}`);
                    return this.req(method, url, params, isPrivate);
                } else if (err.message == `Request failed with status code 503`) {
                    logger.trace('[binance][重发]', `${new Date() - timeOn}ms`, method, url, `${JSON.stringify(params)} => ${err.response?.data?.msg || err.message}`);
                    return this.req(method, url, params, isPrivate);
                } else if (err.message == `Request failed with status code 404`) {
                    logger.trace('[binance][重发]', `${new Date() - timeOn}ms`, method, url, `${JSON.stringify(params)} => ${err.response?.data?.msg || err.message}`);
                    return this.req(method, url, params, isPrivate);
                }
                logger.trace('[binance]', method, url, `${JSON.stringify(params)} => ${err.response?.data?.msg || err.message}`);
                if (err.response?.data?.msg == 'No need to change position side.') {
                    return true;
                }
                throw err.response?.data || err.message;
            });
    }
}

module.exports.BinanaceApi = BinanaceApi;
