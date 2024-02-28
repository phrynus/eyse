const routers = require('./routers');
const logger = require('./lib/logger');
const config = require('./config');
const models = require('./models');

// 启动
(async () => {
    try {
        // 初始化配置
        await models.InitialBin().catch((error) => {
            throw error;
        });
        await models.InitialKey().catch((error) => {
            throw error;
        });
        // 启动服务
        routers.listen(config.express.port, () => {
            logger.info(`[交易所] ${Object.keys(config.bin)}`);
            logger.info(`[账户] ${Object.keys(config.key)}`);
            logger.info(`[路由] http://127.0.0.1:${config.express.port}/`);
            logger.info(`[TV] ${JSON.stringify(config.tv.model)}`);
            console.log('Server started');
        });
    } catch (error) {
        console.log('Server defeat', error);
    }
})();
