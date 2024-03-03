const jwt = require('jsonwebtoken');
const secretKey = 'your_secret_key';
function generateAccessToken(user) {
    // 生成访问令牌
    const accessToken = jwt.sign({ userId: user._id }, secretKey, { expiresIn: '1h' });

    // 生成刷新令牌
    const refreshToken = jwt.sign({ username: username }, secretKey, { expiresIn: '7d' });

    return { accessToken, refreshToken };
}
async function verifyToken(ctx, next) {
    // 从请求头中获取令牌
    const token = ctx.headers['authorization'];

    // 如果令牌不存在，则返回 403 错误
    if (!token) {
        ctx.status = 403;
        ctx.body = 'Access denied';
        return;
    }

    try {
        // 验证令牌
        const decoded = jwt.verify(token, secretKey);
        // 将解码后的信息添加到上下文中，以便后续中间件使用
        ctx.user = decoded;
        await next(); // 继续处理请求
    } catch (err) {
        // 令牌无效时返回 401 错误
        ctx.status = 401;
        ctx.body = 'Invalid token';
    }
}
module.exports = { generateAccessToken, verifyToken };