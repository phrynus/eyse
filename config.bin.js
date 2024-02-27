module.exports = {
    v: {
        name: 'EYSE',
    },
    // 必持仓币种
    safePositionSymbol: [
        'BTCUSDT',
        'ETHUSDT',
        // 'BNBUSDT'
    ],
    // 必币种数量
    safePositionNum: 10,
    //
    safeRepeatList: [],
    key: [
        {
            name: '',
            exchange: 'binance',
            key: '',
            secret: '',
            newBin: null,
            token: '',
        },
    ],
    bin: {
        binance: {
            baseUrl: 'https://fapi.binance.com',
            timeUrl: '/fapi/v1/time',
            timeOffset: 0,
            exchangeInfoUrl: '/fapi/v1/exchangeInfo',
            exchangeInfo: {},
            recvWindow: 5000,
        },
    },
    mongoose: {
        url: 'mongodb://',
    },
    express: {
        port: 3000,
    },
    tv: {
        model: {
            // UUID 数组
            tokens: ['00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'],
            // 交易所：交易品种
            ticker: '{{ticker}}',
            // 持仓方向 LONG SHORT
            market_position: '{{strategy.market_position}}', //{{strategy.market_position}} - 以字符串形式返回策略的当前位置：“long”、“flat”、或 “short”。如果是“flat”，使用上一个位置的方向。
            prev_market_position: '{{strategy.prev_market_position}}', //{{strategy.prev_market_position}} - 以字符串形式返回策略的上一个位置：“long”、“flat”、或 “short”。如果是“flat”，也为。
            // 交易类型
            action: '{{strategy.order.action}}', //{{strategy.order.action}} - 为执行的订单返回字符串“buy”或“sell”。
            // 执行完后的数量
            position_size: '{{strategy.position_size}}',
            prev_market_position_size: '{{strategy.prev_market_position_size}} ',
            // 交易数量
            contracts: '{{strategy.order.contracts}}',
            // 交易价格
            price: '{{strategy.order.price}}',
            // MARKET 市价 ； LIMIT 限价
            type: 'MARKET',
            // 倍数
            lever: 20,
            // 注释
            comment: '{{strategy.order.comment}}',
            // 安全模式 - 持仓数量
            safePositionSymbol: true,
        },
    },
};
