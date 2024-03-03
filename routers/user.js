const router = require('koa-router');
const speakeasy = require('speakeasy');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const db = require('../lib/db');
const logger = require('../lib/logger');

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

const user = new router();

user.post('/reg', async (ctx) => {
    try {
        const { name } = ctx.request.body;

        // Regular expression to validate username
        const usernameRegex = /^[a-zA-Z0-9_-]{3,16}$/;

        if (!name || !usernameRegex.test(name)) {
            ctx.status = 400;
            ctx.body = '参数错误，用户名必须由3到16个字符组成，只能包含字母、数字、下划线和短横线';
            return;
        }

        // Check if the username or IP already exists
        const existingUser = await db.UserModel.findOne({ name });
        const existingUsersWithSameIp = await db.UserModel.find({ create_ip: ctx.getIp });

        if (existingUser || existingUsersWithSameIp.length >= 999999) {
            ctx.status = 400;
            ctx.body = '用户名已存在或者IP注册次数过多，请更换用户名或者稍后再试';
            return;
        }

        // Generate TOTP secret and save user
        const totpSecret = speakeasy.generateSecret({ length: 20, name: `EYSE:${name}` });
        const newUser = new db.UserModel({
            name,
            totp: totpSecret,
            login_ip: ctx.getIp,
            login_at: new Date(),
            create_ip: ctx.getIp,
            create_at: new Date(),
        });
        await newUser.save();
        logger.info(`[注册] ${name} ${ctx.getIp}`);
        const qr = await QRCode.toDataURL(totpSecret.otpauth_url, { errorCorrectionLevel: 'H' });
        ctx.body = {
            QRCode: qr,
        };
    } catch (error) {
        console.error(error);
        ctx.status = 500;
        ctx.body = {
            code: 1,
            msg: error.message,
        };
    }
});
user.post('/login', async (ctx) => {
    try {
        const { name, totp } = ctx.request.body;
        const user = await db.UserModel.findOne({ name }).exec();
        if (!user) {
            ctx.status = 400;
            ctx.body = '用户不存在';
            return;
        }
        const tokenValidates = speakeasy.totp.verify({
            secret: user.totp.base32,
            encoding: 'base32',
            token: Number(totp),
            window: 1,
        });
        if (!tokenValidates) {
            ctx.status = 400;
            ctx.body = '动态口令错误';
            return;
        }
        await db.UserModel.updateOne(
            { _id: user._id },
            {
                $set: {
                    login_ip: ctx.getIp,
                    login_at: new Date(),
                },
            }
        );
        const key = await db.KeyModel.find({ name: user.name }, { key: 0, secret: 0, _id: 0, __v: 0 }).exec();

        const accessToken = jwt.sign({ userName: user.name }, secretKey, { expiresIn: '1h' });
        // 生成刷新令牌
        const refreshToken = jwt.sign({ userName: user.name }, secretKey, { expiresIn: '7d' });

        ctx.body = {
            name: user.name,
            token: {
                accessToken,
                refreshToken,
            },
            key,
        };
    } catch (error) {
        console.error(error);
        ctx.status = 500;
        ctx.body = error.message;
    }
});
user.post('/refresh', async (ctx) => {
    const { refreshToken } = ctx.request.body;
    if (!refreshToken) {
        ctx.status = 400;
        ctx.body = 'Refresh token is required';
        return;
    }
    try {
        // 验证刷新令牌
        const decoded = jwt.verify(refreshToken, secretKey);

        // 如果刷新令牌有效，生成新的访问令牌
        const accessToken = jwt.sign({ userName: decoded.userName }, secretKey, { expiresIn: '1h' });

        ctx.body = { accessToken };
    } catch (err) {
        ctx.status = 401;
        ctx.body = 'Token 失效';
    }
});

module.exports = user;
