const express = require('express');
const bodyParser = require('body-parser'); // 解析请求体中的 JSON 数据
const db = require('../lib/db');
const logger = require('../lib/logger');
const config = require('../config');
const models = require('../models');
// TV数据库模型
const tvModel = db.model('tv', {
    // 名称
    name: String,
    // 交易所
    token: String,
    // 交易代号
    tradeType: String,
    // 交易描述
    comment: String,
    // 接收
    params: Object,
    // 请求参数
    bin_params: Object,
    // bin返回参数
    bin_result: Object,
    // 创建时间
    create_at: Date,
    // 更新时间
    update_at: Date,
});

// 路由
const tv = express();

tv.use(bodyParser.json()); // 解析 JSON 请求体
// TV请求路径
tv.post('/', async (req, res) => {
    try {
        // 请求参数
        const params = { ...req.body };
        const results = [];
        let status = 200;
        //  重复检查
        if (models.IsRepeat(params)) {
            logger.warn('[TV][重复请求]');
            return res.status(500).json({ message: '重复请求' });
        }
        logger.info(`[TV][接收][${params.tokens.length}]`);
        for (const token of params.tokens) {
            // 获取交易所
            const bin = config.key[token];
            if (bin === undefined) {
                results.push('No key');
                status = 500;
                // 跳过循环
                continue;
            }

            // 写入数据库
            const newTvModel = await new tvModel({
                name: bin.name,
                token,
                tradeType: null,
                comment: null,
                params,
                bin_params: {},
                bin_result: {},
                create_at: new Date(),
                update_at: new Date(),
            }).save();
            logger.trace('[TV]', `[${newTvModel._id}]`, '写入数据库');

            // 解构订单信息对象
            const { bin_params, tradeType, comment, err } = await models.CheckOrder(params, bin).catch((err) => {
                results.push(err);
                status = 500;
                return err;
            });
            if (status == 500) {
                continue;
            }
            // 请求
            const bin_result = await bin.newBin.req('POST', '/fapi/v1/order', bin_params, true).catch((err) => {
                status = 300;
                return err;
            });
            // 更新数据
            newTvModel.bin_params = bin_params || err || {};
            newTvModel.comment = comment || '';
            newTvModel.tradeType = tradeType || '';
            newTvModel.bin_result = bin_result;
            newTvModel.update_at = new Date();
            newTvModel.save();

            logger.info(`[TV][${tradeType}][${comment}]`);

            // // 返回参数
            results.push(bin_result);
        }
        return res.status(status).json(results);
    } catch (err) {
        logger.error('[TV]', err);
        return res.status(500).json(err);
    }
});
tv.post('/custom', async (req, res) => {
    try {
        // 请求参数
        const { tokens, params, url, model, isPrivate = false } = { ...req.body };
        const results = [];
        let status = 200;

        for (const token of tokens) {
            console.log(token);
            // 获取交易所
            const bin = config.key[token];
            if (bin === undefined) {
                results.push('No key');
                status = 500;
                // 跳过循环
                continue;
            }
            const result = await bin.newBin.req(model, url, params, isPrivate == 'true' ? true : false).catch((err) => {
                status = 300;
                return err;
            });
            results.push(result);
        }
        return res.status(status).json(results);
    } catch (err) {
        logger.error('[TV]', err);
        return res.status(500).json(err);
    }
});
module.exports = tv;
