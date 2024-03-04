const router = require('koa-router');
const see = new router();

see.get('/:seeId', async (ctx) => {
    const { seeId } = ctx.params;
    // ctx.status.seeId = seeId;
    await ctx.render('see', {
        seeId,
    });
});

module.exports = see;
