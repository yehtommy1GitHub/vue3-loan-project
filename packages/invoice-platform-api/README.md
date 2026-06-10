# @vue3-invoice/platform-api

發票平台業務 API 本地套件，內建通用 API SDK 核心，提供登入、註冊、使用者資料、發票放款資訊、異動紀錄與匯率 API。

## 安裝

```bash
npm install ./local-packages/vue3-invoice-platform-api-1.0.0.tgz
```

## 使用

```ts
import { createInvoicePlatformApi } from '@vue3-invoice/platform-api';

const invoiceApi = createInvoicePlatformApi({
  baseURL: 'http://127.0.0.1:8080',
  timeout: 8000
});

const user = await invoiceApi.login('DEMO0001', 'DemoPass123!');
const rates = await invoiceApi.fetchExchangeRates();
```

使用端可透過 `endpoints` 覆寫特定路徑，也可透過 `client` 注入既有 Axios instance。
