# @vue3-invoice/api-sdk

通用 TypeScript API SDK，提供端點設定、Axios Client 建立、動態路徑解析、統一 request、錯誤正規化與 `success` 欄位檢查。

## 安裝

```bash
npm install ./local-packages/vue3-invoice-api-sdk-1.0.0.tgz
```

## 使用

```ts
import { assertApiSuccess, createApiSdk } from '@vue3-invoice/api-sdk';

const sdk = createApiSdk({
  baseURL: 'http://127.0.0.1:8080',
  endpoints: {
    fetchUser: {
      method: 'GET',
      path: ({ account }) => `/users/${encodeURIComponent(String(account ?? ''))}`
    }
  }
});

const response = await sdk.request('fetchUser', {
  params: { account: 'DEMO0001' }
});

assertApiSuccess(response);
```

使用端可透過 `client` 注入既有 Axios instance，加入 token interceptor、記錄或測試替身。
