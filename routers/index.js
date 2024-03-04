const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const koaViews = require('koa-views');
const path = require('path');
// 引入tv模块
const tv = require('./tv');
const user = require('./user');
const api = require('./api');
const see = require('./see');

// 创建本身:
const app = new Koa();
const router = new Router();
// 处理数据
app.use(bodyParser());
// 访问日志
app.use(async (ctx, next) => {
    ctx.getIp = (ctx.get('X-Forwarded-For') || ctx.get('x-real-ip') || ctx.ip).replace(/:\d+$/, '');
    await next();
});
// 静态文件服务
app.use(
    koaViews(path.join(__dirname, '../views'), {
        extension: 'ejs',
    })
);
// 设置路由
router.use('/tv', tv.routes(), tv.allowedMethods());
router.use('/user', user.routes(), user.allowedMethods());
router.use('/api', api.routes(), api.allowedMethods());
router.use('/see', see.routes(), see.allowedMethods());
app.use(router.routes());

// app.listen(3001);
module.exports = app;
