const router = require('koa-router');
const db = require('../../lib/db');
const info = new router();

// 使用token登录
info.post('/', async (ctx) => {
    try {
        const user = await db.UserModel.findOne({ name: ctx.user.userName });
        if (!user) {
            ctx.status = 400;
            ctx.body = '用户不存在';
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
        const key = await db.KeyModel.find({ name: user.name }, { key: 0, secret: 0, _id: 0, __v: 0}).exec();

        ctx.body = {
            name: user.name,
            key: key,
        };
    } catch (err) {
        ctx.status = 401;
        console.log(err);
        return;
    }
});
module.exports = info;
