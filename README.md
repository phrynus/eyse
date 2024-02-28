## 基本说明

#### 启动脚本

```npm
npm install -g pm2
pnpm i
pm2 start bot.js
```

#### 功能

-   [x] 多账户
-   [x] 双向持仓
-   [x] 反向开单
-   [x] 限价、市价
-   [x] 自定义请求
-   [ ] 自定义下单
-   [ ] 限价限时重新下单
-   [ ] 前端面板

#### 安全

-   [x] 控制交易数量（`可指定币种` `会增加延迟`）
-   [x] 重复交易
-   [x] IP 白名单
-   [x] 报错重发
-   [ ] 保本比例

## 路由规则

#### TV 模型 `POST` `/tv`

```json
{
    "tokens": ["27a44cec4fb3832072bf1bded571d59b"],
    "ticker": "{{ticker}}",
    "market_position": "{{strategy.market_position}}",
    "prev_market_position": "{{strategy.prev_market_position}}",
    "action": "{{strategy.order.action}}",
    "position_size": "{{strategy.position_size}}",
    "market_position_size": "{{strategy.market_position_size}}",
    "prev_market_position_size": "{{strategy.prev_market_position_size}}",
    "contracts": "{{strategy.order.contracts}}",
    "price": "{{strategy.order.price}}",
    "type": "MARKET",
    "lever": 20,
    "comment": "{{strategy.order.comment}}",
    "timenow": "{{timenow}}",
    "safePositionSymbol": true
}
```

##### 自定义下单 `POST` `/tv/order`

```json
{
    "tokens": ["00000000000000000000000000000000"],
    "position": "LONG,SHORT",
    "action": "BUY,SELL,CLOSE,OPEN",
    "quantity": "0.1",
    "price": "2000",
    "type": "MARKET",
    "lever": 20,
}
```
##### 自定义请求 `POST` `/tv/custom`

```json
{
    "tokens": ["00000000000000000000000000000000"],
    "model": "GET",
    "url": "/fapi/v2/account",
    "params": {},
    "isPrivate": "true"
}
```

#### 前端面板 `GET` `/v`
