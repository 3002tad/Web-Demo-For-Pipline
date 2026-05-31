# MarketHub Behavior Bot

Bot nay dung Playwright de gia lap nhieu nguoi dung thao tac UI that tren Web Demo. Bot khong goi tracking API truc tiep; tracking-sdk trong browser se tu tao event nhu nguoi dung that.

## Chay

Chay Web Demo truoc:

```powershell
npm run dev
```

Neu muon tao ca order/revenue, chay them:

```powershell
npm run worker
npm run adapter
```

Chay bot:

```powershell
npm run bot
```

Override nhanh bang CLI:

```powershell
npm run bot -- --users 50 --concurrency 5 --purchase-rate 0.12
```

## Ti Le Hanh Vi

Ti le doc tu `.env` hoac CLI:

```env
BOT_LOGIN_RATE=0.30
BOT_SEARCH_RATE=0.65
BOT_FILTER_RATE=0.40
BOT_PRODUCT_VIEW_RATE=0.80
BOT_BANNER_VIEW_RATE=0.55
BOT_BANNER_CLICK_RATE=0.18
BOT_ADD_TO_CART_RATE=0.35
BOT_REMOVE_FROM_CART_RATE=0.12
BOT_CHECKOUT_START_RATE=0.20
BOT_PURCHASE_RATE=0.12
BOT_CART_ABANDON_RATE=0.08
BOT_USE_PERSONA_RATES=false
```

Mac dinh persona chi dung de gan nhan phan tich. Bat `BOT_USE_PERSONA_RATES=true` neu muon persona tu dieu chinh ti le.

Report sinh ra tai:

```text
output/behavior-bot/latest-report.json
```
