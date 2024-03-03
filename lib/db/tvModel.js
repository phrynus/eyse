const mongodb = require('./mongodb');
const tvModel = mongodb.model('tv', {
    // 名称
    name: String,
    // 交易所
    token: String,
    // 交易代号
    tradeType: String,
    // symbol
    symbol: String,
    // 交易描述
    comment: String,
    // 接收
    params: Object,
    // 请求参数
    bin_params: Object,
    // bin返回参数
    bin_result: Object,
    // 创建时间
    create_at: {
        type: Date,
    },
    // 更新时间
    update_at: {
        type: Date,
    },
});

module.exports = tvModel;
