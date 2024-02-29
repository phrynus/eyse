const config = require('../config');
const logger = require('../lib/logger');
module.exports = async function checkOrder(params, bin) {
    try {
        // 解构订单信息对象
        const {
            ticker,
            prev_market_position,
            market_position,
            action,
            position_size,
            market_position_size,
            prev_market_position_size,
            contracts,
            price,
            type = 'MARKET',
            timeInForce = 'GTC',
            lever = 20,
            comment = '',
            safePositionSymbol = true,
        } = params;

        // 如果关键参数缺失，则抛出参数错误异常
        if (!ticker || !market_position || !contracts || !position_size || !market_position_size || !prev_market_position_size || !price || !action || !ticker.split('.')[0]) {
            throw 'Parameter error';
        }
        // 取交易币
        const coin = ticker.split('.')[0];

        // 获取交易对的交易所信息
        const exchangeInfoSymbol = bin.newBin.exchangeInfo.symbols.find((item) => item.symbol === coin);
        const minQty = Number(exchangeInfoSymbol.filters[1].minQty);
        const maxQty = Number(exchangeInfoSymbol.filters[1].maxQty);
        const minPrice = Number(exchangeInfoSymbol.filters[0].minPrice);
        const maxPrice = Number(exchangeInfoSymbol.filters[0].maxPrice);

        // 检查数量和价格是否在有效范围内
        if (minQty > Number(contracts) || maxQty < Number(contracts)) {
            throw { msg: 'Parameter Qty error contracts', symbols: exchangeInfoSymbol };
        }
        if (minPrice > Number(price) || maxPrice < Number(price)) {
            throw { msg: 'Parameter Price error contracts', symbols: exchangeInfoSymbol };
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
            positionSide: market_position === 'flat' ? prev_market_position.toUpperCase() : market_position.toUpperCase(),
            side: action.toUpperCase(),
            quantity: Number(contracts).toFixed(exchangeInfoSymbol.quantityPrecision),
        };

        // 如果是限价单，设置价格和有效期
        if (type === 'LIMIT') {
            bin_params.price = Number(price).toFixed(exchangeInfoSymbol.pricePrecision);
            bin_params.timeInForce = timeInForce;
        }

        let tradeType;
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

        if (params.market_position === 'long') {
            // 多单
            if (params.prev_market_position === 'flat' && params.action === 'buy') {
                tradeType = '多开单';
            } else if (params.prev_market_position === 'short' && params.action === 'buy') {
                tradeType = '空转多';
                // bin_params.quantity = Number(market_position_size).toFixed(exchangeInfoSymbol.quantityPrecision);
                await bin.newBin.req('POST', '/fapi/v1/order', { symbol: coin, type: 'MARKET', positionSide: 'SHORT', quantity: exchangeInfoSymbol.filters[2].maxQty, side: 'BUY' }, true).catch((err) => {
                    if (err.code == -2022) {
                        logger.info('[checkOrder][多转空][没单平个鸡毛]', err);
                    } else {
                        logger.warn('[checkOrder][多转空][平仓失败]', err);
                        throw err;
                    }
                });
            } else if (params.market_position_size > params.prev_market_position_size) {
                tradeType = '多加仓';
            } else if (params.market_position_size < params.prev_market_position_size) {
                tradeType = '多减仓';
            } else if (params.position_size === '0') {
                // 非正常情况
                tradeType = '多平单';
            }
        } else if (params.market_position === 'short') {
            // 空单
            if (params.prev_market_position === 'flat' && params.action === 'sell') {
                tradeType = '空开单';
            } else if (params.prev_market_position === 'long' && params.action === 'sell') {
                tradeType = '多转空';
                // bin_params.quantity = Number(market_position_size).toFixed(exchangeInfoSymbol.quantityPrecision);
                await bin.newBin.req('POST', '/fapi/v1/order', { symbol: coin, type: 'MARKET', positionSide: 'LONG', quantity: exchangeInfoSymbol.filters[2].maxQty, side: 'SELL' }, true).catch((err) => {
                    if (err.code == -2022) {
                        logger.info('[checkOrder][多转空][没单平个鸡毛]', err);
                    } else {
                        logger.warn('[checkOrder][多转空][平仓失败]', err);
                        throw err;
                    }
                });
            } else if (params.market_position_size > params.prev_market_position_size) {
                tradeType = '空加仓';
            } else if (params.market_position_size < params.prev_market_position_size) {
                tradeType = '空减仓';
            }
        } else if (params.market_position === 'flat') {
            if (params.prev_market_position == 'long' && params.action === 'sell' && params.position_size === '0') {
                tradeType = '多平单';
            } else if (params.prev_market_position == 'short' && params.action === 'buy' && params.position_size === '0') {
                tradeType = '空平单';
            }
        }
        return { bin_params, tradeType, comment, coin };
    } catch (err) {
        throw err;
    }
};
