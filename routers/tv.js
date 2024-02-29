const router = require('koa-router');
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
    // symbol
    symbol: String,
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
const tv = new router();
tv.use(async (ctx, next) => {
    ctx.isIp = config.whitelist.indexOf(ctx.getIp);
    await next();
});
tv.post('/', async (ctx) => {
    try {
        // 请求参数
        const params = { ...ctx.request.body };
        const results = [];
        if (ctx.isIp == -1) {
            throw Error('非法IP');
        } else if (models.IsRepeat(params)) {
            throw Error('重复请求');
        } else if (params.tokens === undefined) {
            throw Error('tokens is undefined');
        }
        for (const token of params.tokens) {
            // 获取交易所
            const bin = config.key[token];
            if (bin === undefined) {
                results.push('No key');
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
            const { bin_params, tradeType, comment, coin, err } = await models.CheckOrder(params, bin).catch((err) => {
                results.push(err);
                ctx.status = 300;

                return err;
            });
            if (ctx.status == 300) {
                continue;
            }
            // 请求
            const bin_result = await bin.newBin.req('POST', '/fapi/v1/order', bin_params, true).catch((err) => {
                ctx.status = 300;
                return err;
            });
            // 更新数据
            newTvModel.symbol = coin || '';
            newTvModel.comment = comment || '';
            newTvModel.tradeType = tradeType || '';
            newTvModel.bin_params = bin_params || err || {};
            newTvModel.bin_result = bin_result || err || {};
            newTvModel.update_at = new Date();
            newTvModel.save();

            logger.info(`[TV][${tradeType}][${comment}]`);

            // // 返回参数
            results.push(bin_result);
        }
        ctx.body = results;
    } catch (err) {
        logger.error('[TV]', err);
        ctx.status = 400;
        ctx.body = {
            msg: err.message,
        };
    }
});
tv.post('/order', async (ctx) => {
    try {
        const { tokens, position, action, quantity, price, type = 'MARKET', lever = 20 } = { ...ctx.request.body };
        if (ctx.isIp == -1) {
            throw Error('非法IP');
        } else if (tokens === undefined || position === undefined || action === undefined || quantity === undefined) {
            throw Error('body is undefined');
        }
        // 请求参数
        ctx.body = 'ok';
    } catch (err) {
        logger.error('[TV]', err);
        ctx.status = 400;
        ctx.body = {
            msg: err.message,
        };
    }
});
tv.post('/custom', async (ctx) => {
    try {
        const { tokens, params, url, model, isPrivate = false } = { ...ctx.request.body };
        if (ctx.isIp == -1) {
            throw Error('非法IP');
        } else if (tokens === undefined || params === undefined || url === undefined || model === undefined) {
            throw Error('body is undefined');
        }
        // 请求参数

        const results = [];
        for (const token of tokens) {
            console.log(token);
            // 获取交易所
            const bin = config.key[token];
            if (bin === undefined) {
                results.push('No key');
                ctx.status = 300;

                // 跳过循环
                continue;
            }
            const result = await bin.newBin.req(model, url, params, isPrivate == 'true' ? true : false).catch((err) => {
                ctx.status = 300;
                return err;
            });
            results.push(result);
        }
        ctx.body = results;
    } catch (err) {
        logger.error('[TV]', err);
        ctx.status = 400;
        ctx.body = {
            msg: err.message,
        };
    }
});

module.exports = tv;
