const router = require('koa-router');
const config = require('../../config');
const db = require('../../lib/db');
const getToken = require('../../models/getToken');
const { BinanaceApi } = require('../../lib/client');
const logger = require('../../lib/logger');

const keyRouter = new router();

// 使用token登录
keyRouter.post('/add', async (ctx) => {
    try {
        const { exchange, key, secret, safe_num, safe_symbol, safe_full, safe_both, safe_trade } = ctx.request.body;

        if (!exchange || !key || !secret || !safe_num || !safe_symbol || !safe_full || !safe_both || !safe_trade) {
            ctx.status = 400;
            ctx.body = '参数错误';
            return;
        }
        const token = getToken(key, secret);

        const user = await db.KeyModel.findOne({ token }).exec();
        if (user) {
            ctx.status = 301;
            ctx.body = 'KEY已存在';
            return;
        }
        const seeId = getToken(key, secret, new Date().getTime());

        const existingKey = await db
            .KeyModel({
                name: ctx.user.userName,
                exchange,
                key,
                token,
                seeId,
                secret,
                safe_num,
                safe_symbol,
                safe_full,
                safe_both,
                safe_trade,
            })
            .save();
        config.key[token] = { ...existingKey._doc, newBin: new BinanaceApi(existingKey) };
        const keys = await db.KeyModel.find({ name: ctx.user.userName }, { key: 0, secret: 0, _id: 0, __v: 0 }).exec();
        console.log(config);
        ctx.body = {
            name: ctx.user.userName,
            key: keys,
        };
    } catch (err) {
        ctx.status = 400;
        return err;
    }
});
keyRouter.post('/delete', async (ctx) => {
    try {
        const { token } = ctx.request.body;
        const user = await db.KeyModel.findOne({ token, name: ctx.user.userName }).exec();

        if (!user) {
            ctx.status = 400;
            ctx.body = 'KEY不存在';
            return;
        }
        await db.KeyModel.deleteOne(user);
        delete config.key[token];
        const keys = await db.KeyModel.find({ name: ctx.user.userName }, { key: 0, secret: 0, _id: 0, __v: 0 }).exec();
        ctx.body = {
            name: ctx.user.userName,
            key: keys,
        };
    } catch (err) {
        ctx.status = 400;
        return err;
    }
});
module.exports = keyRouter;
