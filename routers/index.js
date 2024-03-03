const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
// 引入tv模块
const tv = require('./tv');
const user = require('./user');
const api = require('./api');

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
// 设置路由
router.use('/tv', tv.routes(), tv.allowedMethods());
router.use('/user', user.routes(), user.allowedMethods());
router.use('/api', api.routes(), api.allowedMethods());

app.use(router.routes());
// 静态文件服务
// app.use(serve(path.join(__dirname, '../views/dist')));
// 处理根路由
// app.use(async (ctx) => {
//     if (ctx.path.startsWith('/v')) {
//         ctx.type = 'html';
//         // ctx.body = fs.createReadStream(path.join(__dirname, 'dist/index.html'));
//     } else {
//         await next();
//     }
//     // ctx.body = fs.createReadStream(path.join(__dirname, 'views/index.html'));
// });
// app.listen(3001);
module.exports = app;
