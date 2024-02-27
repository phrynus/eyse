const axios = require('axios');
const routers = require('./routers');
const models = require('./models');
const { BinanaceApi } = require('./lib/client');
const logger = require('./lib/logger');
const config = require('./config');
// const ChildProcess = process.fork('./');

// ChildProcess.on('exit', function (code) {
//     logger.error('[重启]', `${code}`);
//     if (code !== 0) {
//         process.fork('./bot.js');
//     }
// });

//
axios.defaults.timeout = 1000 * 10; // 10s
// 启动
(async () => {
    // 设置交易所
    for (const [key, value] of Object.entries(config.bin)) {
        // 交易所时间
        await axios(`${value.baseUrl + value.timeUrl}`)
            .then((res) => {
                value.timeOffset = res.data.serverTime - Date.now();
            })
            .catch(async (err) => {
                await logger.error('启动失败', `${value.baseUrl + value.timeUrl}`, err.message);
                // 重启
                process.exit(1);
            });

        // 交易所参数
        await axios(`${value.baseUrl + value.exchangeInfoUrl}`)
            .then((res) => {
                value.exchangeInfo = res.data || {};
            })
            .catch(async (err) => {
                await logger.error('启动失败', `${value.baseUrl + value.timeUrl}`, err.message);
                process.exit(1);
            });
    }
    // 初始化KEY
    config.key = config.key.reduce((tokens, item) => {
        const token = models.Token(item.key, item.secret);
        tokens[token] = item;
        if (item.exchange === 'binance') {
            item.newBin = new BinanaceApi(item);
            item.token = token;
        }
        return tokens;
    }, {});
    config.tv.model.tokens = Object.keys(config.key);

    logger.info('TV模板', JSON.stringify(config.tv.model));

    // 监听路由
    routers.listen(config.express.port);
    logger.info('监听路由', `http://127.0.0.1:${config.express.port}`);
    console.log('服务启动成功');
})();
