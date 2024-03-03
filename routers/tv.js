const router = require('koa-router');
const db = require('../lib/db');
const logger = require('../lib/logger');
const config = require('../config');
const models = require('../models');

const tv = new router();
tv.use(async (ctx, next) => {
    ctx.isIp = config.whitelist.indexOf(ctx.getIp);
    logger.info(`[WEB][${ctx.getIp}][${ctx.request.url}] > ${JSON.stringify(ctx.request.body)}`);
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
            const newTvModel = await new db.TvModel({
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
            const { bin_params, tradeType, comment, coin, err } = await models.CheckOrderTv(params, bin).catch((err) => {
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
// bin.post('/order', async (ctx) => {
//     try {
//         const params = { ...ctx.request.body };
//         const results = [];

//         if (ctx.isIp == -1) {
//             throw Error('非法IP');
//         } else if (params.tokens === undefined) {
//             throw Error('tokens is undefined');
//         }

//         for (const token of params.tokens) {
//             // 获取交易所
//             const bin = config.key[token];
//             if (bin === undefined) {
//                 results.push('No key');
//                 // 跳过循环
//                 continue;
//             }
//             // 写入数据库
//             const newTvModel = await new binModel({
//                 name: bin.name,
//                 token,
//                 tradeType: null,
//                 comment: '手动交易',
//                 params,
//                 bin_params: {},
//                 bin_result: {},
//                 create_at: new Date(),
//                 update_at: new Date(),
//             }).save();
//             // 解构订单信息对象
//             const { bin_params, tradeType, err, coin } = await models.CheckOrder(params, bin).catch((err) => {
//                 results.push(err);
//                 ctx.status = 300;
//                 return err;
//             });

//             if (ctx.status == 300) {
//                 continue;
//             }
//             // 请求
//             const bin_result = await bin.newBin.req('POST', '/fapi/v1/order', bin_params, true).catch((err) => {
//                 ctx.status = 300;
//                 return err;
//             });
//             // 更新数据
//             newTvModel.symbol = coin || '';
//             newTvModel.tradeType = tradeType || '';
//             newTvModel.bin_params = bin_params || err || {};
//             newTvModel.bin_result = bin_result || err || {};
//             newTvModel.update_at = new Date();
//             newTvModel.save();

//             logger.info(`[ORDER][${tradeType}]`);
//             // // 返回参数
//             results.push(bin_result);
//         }
//         ctx.body = results;
//     } catch (err) {
//         logger.error('[TV][ORDER]', err);
//         ctx.status = 400;
//         ctx.body = {
//             msg: err.message,
//         };
//     }
// });
// bin.post('/custom', async (ctx) => {
//     try {
//         const { tokens, params, url, model, isPrivate = false } = { ...ctx.request.body };
//         if (ctx.isIp == -1) {
//             throw Error('非法IP');
//         } else if (tokens === undefined || params === undefined || url === undefined || model === undefined) {
//             throw Error('body is undefined');
//         }
//         // 请求参数

//         const results = [];
//         for (const token of tokens) {
//             console.log(token);
//             // 获取交易所
//             const bin = config.key[token];
//             if (bin === undefined) {
//                 results.push('No key');
//                 ctx.status = 300;

//                 // 跳过循环
//                 continue;
//             }
//             const result = await bin.newBin.req(model, url, params, isPrivate == 'true' ? true : false).catch((err) => {
//                 ctx.status = 300;
//                 return err;
//             });
//             results.push(result);
//         }
//         ctx.body = results;
//     } catch (err) {
//         logger.error('[TV]', err);
//         ctx.status = 400;
//         ctx.body = {
//             msg: err.message,
//         };
//     }
// });

module.exports = tv;
