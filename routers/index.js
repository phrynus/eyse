const config = require('../config');
const logger = require('../lib/logger');
const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const koaIp = require('koa-ip');
// 引入tv模块
const tv = require('./tv');
// 创建本身:
const app = new Koa();
const router = new Router();
// 处理数据
app.use(bodyParser());
app.use(koaIp(config.whitelist));
// 访问日志
app.use(async (ctx, next) => {
    ctx.getIp = (ctx.get('X-Forwarded-For') || ctx.get('x-real-ip') || ctx.ip).replace(/:\d+$/, '');
    logger.info(`[WEB][${ctx.getIp}][${ctx.request.url}] > ${JSON.stringify(ctx.request.body)}`);
    await next();
});
// 设置路由
router.use('/tv', tv.routes(), tv.allowedMethods());
app.use(router.routes());
// app.listen(3001);
module.exports = app;
