## Eyse

> 计划重写整个框架

#### 启动脚本

```npm
npm install -g pm2
pnpm i
pm2 start bot.js
```

#### 功能

-   [x] 双向持仓
-   [x] 反向开单
-   [x] 限价、市价
-   [x] IP 白名单
-   [x] 禁止重复交易
-   [x] TV 订单
-   [x] 自定义下单
-   [x] 自定义请求
-   [ ] 单向持仓
-   [ ] 限价限时重新下单
-   [ ] 前端面板

#### 账户

-   [x] 登录注册 `Name\Totp\Token`
-   [x] 增删改查 KEY
-   [x] TOTP 登录 `动态口令` `和谷歌、币安的那个一样`
-   [x] 安全 `每个key独立控制`
    -   [x] 持仓数量 `开仓时检索` `不影响加减关`
    -   [x] 必持仓币种
    -   [x] 转为全仓 `交易前执行`
    -   [x] 转为双向持仓 `目前只支持双向`
    -   [x] 交易开关

## 路由规则

#### TV 模型 `POST` `/tv`

```json
{
    "tokens": ["00000000000000000000000000000000"],
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
    "symbol": "BTCUSDT",
    "position": "LONG,SHORT",
    "action": "ADD,CUT,CLOSE,OPEN",
    "quantity": "0.1",
    "price": "2000", // 市价情况下可不填
    "type": "MARKET", // 默认MARKET
    "lever": 20, // 默认20
    "safePositionSymbol": true
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
