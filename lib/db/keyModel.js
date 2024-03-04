const mongodb = require('./mongodb');
const keyModel = mongodb.model('key', {
    // 名称
    name: String,
    // 交易所
    exchange: String,
    // KEY
    key: String,
    // 密钥
    secret: String,
    // Token
    token: String,
    // 观摩ID
    seeId: String,
    // 安全模式 - 持仓数量
    safe_num: Number,
    // 安全模式 - 必持仓币种
    safe_symbol: Object,
    // 安全模式 - 自动转为全仓
    safe_full: Boolean,
    // 安全模式 - 自动转为双向持仓
    safe_both: Boolean,
    // 安全模式 - 开启交易
    safe_trade: Boolean,
});

module.exports = keyModel;
