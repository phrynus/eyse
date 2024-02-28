module.exports = (params) => {
    if (params.market_position === 'long') {
        // 多单
        if (params.prev_market_position === 'flat' && params.action === 'buy') {
            return '多开单';
        } else if (params.action === 'sell' && params.position_size === '0') {
            return '多平单';
        } else if (params.prev_market_position === 'short' && params.action === 'sell') {
            return '空转多';
        } else if (params.market_position_size > params.prev_market_position_size) {
            return '多加仓';
        } else if (params.market_position_size < params.prev_market_position_size) {
            return '多减仓';
        } else if (params.position_size === '0') {
            // 非正常情况
            return '多平单';
        }
    } else if (params.market_position === 'short') {
        // 空单
        if (params.prev_market_position === 'flat' && params.action === 'sell') {
            return '空开单';
        } else if (params.action === 'buy' && params.position_size === '0') {
            return '空平单';
        } else if (params.prev_market_position === 'long' && params.action === 'buy') {
            return '多转空';
        } else if (params.market_position_size > params.prev_market_position_size) {
            return '空加仓';
        } else if (params.market_position_size < params.prev_market_position_size) {
            return '空减仓';
        } else if (params.position_size === '0') {
            // 非正常情况
            return '空平单';
        }
    }
    if ((params.market_position === 'long' && params.prev_market_position === 'flat' && params.prev_market_position_size === '0', params.action === 'buy')) {
        return '多开单';
    }

    if (params.market_position === 'flat' && params.action === 'buy') {
        return '多开单';
    } else if (params.market_position === 'long' && params.action === 'sell') {
        return '多平单';
    } else if (params.prev_market_position === 'long' && params.market_position === 'short') {
        return '多转空';
    } else if (params.prev_market_position_size > 0 && params.market_position_size > params.prev_market_position_size) {
        return '多加仓';
    } else if (params.prev_market_position_size > 0 && params.market_position_size < params.prev_market_position_size) {
        return '多减仓';
    } else if (params.prev_market_position === 'short' && params.market_position === 'long') {
        return '空转多';
    } else if (params.prev_market_position_size < 0 && params.market_position_size < params.prev_market_position_size) {
        return '空加仓';
    } else if (params.prev_market_position_size < 0 && params.market_position_size > params.prev_market_position_size) {
        return '空减仓';
    } else if (params.market_position === 'flat' && params.action === 'sell') {
        return '空开单';
    } else if (params.market_position === 'short' && params.action === 'buy') {
        return '空平单';
    } else return '交易信号错误';
};
