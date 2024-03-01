const config = require('../config');
const logger = require('../lib/logger');
module.exports = async function (params, bin) {
    try {
        // 解构订单信息对象
        const { symbol, position, action, quantity, price = 1, type = 'MARKET', lever = 20, safePositionSymbol = true } = params;
        logger.trace('[checkOrder][开始处理参数]', params);
        // 如果关键参数缺失，则抛出参数错误异常
        if (!symbol || !position || !action || !quantity || !price) {
            throw 'Parameter error';
        }
        // 取交易币
        const coin = symbol;

        // 获取交易对的交易所信息
        const exchangeInfoSymbol = bin.newBin.exchangeInfo.symbols.find((item) => item.symbol === coin);
        const minQty = Number(exchangeInfoSymbol.filters[1].minQty);
        const maxQty = Number(exchangeInfoSymbol.filters[1].maxQty);
        const minPrice = Number(exchangeInfoSymbol.filters[0].minPrice);
        const maxPrice = Number(exchangeInfoSymbol.filters[0].maxPrice);

        // 检查数量和价格是否在有效范围内
        if (minQty > Number(quantity) || maxQty < Number(quantity)) {
            throw { msg: 'Parameter Qty error quantity', symbols: exchangeInfoSymbol, price, minPrice, maxPrice, type };
        }
        if (type != 'MARKET') {
            if (minPrice > Number(price) || maxPrice < Number(price)) {
                throw { msg: 'Parameter Price error price', symbols: exchangeInfoSymbol, price, minPrice, maxPrice, type };
            }
        }
        if (!config.safePositionSymbol.includes(coin) && safePositionSymbol == true) {
            const response = await bin.newBin.req('GET', '/fapi/v2/account', {}, true).catch((err) => {
                throw { msg: '账户信息获取失败', err };
            });
            let positionList = response.positions.filter((pos) => Number(pos.positionInitialMargin) > 0);
            if (positionList.length >= config.safePositionNum) {
                throw { msg: '大于限制币数', positionlist };
            }
            logger.trace('[checkOrder][持仓详情]', positionList);
        }

        const bin_params = {
            symbol: coin,
            type,
            positionSide: position,
            quantity: Number(quantity).toFixed(exchangeInfoSymbol.quantityPrecision),
            timestamp: null,
        };

        // 如果是限价单，设置价格和有效期
        if (type === 'LIMIT') {
            bin_params.price = Number(price).toFixed(exchangeInfoSymbol.pricePrecision);
            bin_params.timeInForce = 'GTC';
        }

        // 设置杠杆
        bin.newBin.req('POST', '/fapi/v1/leverage', { symbol: coin, leverage: lever }, true).catch((err) => {
            logger.trace('[checkOrder][调整杠杆失败]', err);
        });
        // 开单之前调整保证金模式
        if (config.safeFullWarehouse) {
            bin.newBin.req('POST', '/fapi/v1/marginType', { symbol: coin, marginType: 'CROSSED' }, true).catch((err) => {
                logger.trace('[checkOrder][调整保证金模式失败]', err);
            });
        }
        let tradeType = action;

        if (action == 'ADD') {
            bin_params.side = position == 'LONG' ? 'BUY' : 'SELL';
        } else if (action == 'CUT') {
            bin_params.side = position == 'LONG' ? 'SELL' : 'BUY';
        } else if (action == 'CLOSE') {
            bin_params.side = position == 'LONG' ? 'SELL' : 'BUY';
            bin_params.quantity = exchangeInfoSymbol.filters[2].maxQty;
        } else if (action == 'OPEN') {
            bin_params.side = position == 'LONG' ? 'BUY' : 'SELL';
        }
        logger.trace('[checkOrder][参数处理完成]', bin_params, tradeType, coin);

        return { bin_params, tradeType, coin };
    } catch (err) {
        logger.trace('[checkOrder][参数有问题]', params, err);
        throw err;
    }
};
