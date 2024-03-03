const jwt = require('jsonwebtoken');
const router = require('koa-router');

const info = require('./info');
const keyRouter = require('./key');

const api = new router();
// 密钥，用于签署令牌
const secretKey = 'W9VzK1IuwsallOXBsheIyUWTe2MffdKF';
// 验证令牌的中间件
async function verifyToken(ctx, next) {
    const token = ctx.headers['authorization'];
    if (!token) {
        ctx.status = 403;
        return;
    }
    try {
        const decoded = jwt.verify(token, secretKey);
        ctx.user = decoded;
        await next();
    } catch (err) {
        ctx.status = 401;
        return;
    }
}
api.use(verifyToken);

api.use('/info', info.routes(), info.allowedMethods());
api.use('/key', keyRouter.routes(), keyRouter.allowedMethods());

module.exports = api;
