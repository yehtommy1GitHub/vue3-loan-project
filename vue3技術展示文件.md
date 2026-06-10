# Vue3 技術展示文件

最後更新時間：2026/06/10 21:36:51

## 1. 文件目的

本文件依據目前 `vue3-loan-project` 的架構，說明 Vue3 專案常用的元件溝通、路由導航、mock 資料與 Axios 串接、全域狀態管理技術，並提供 TypeScript 實作範例。

> 名詞說明：`piania store` 正確名稱為 **Pinia Store**。目前專案實際使用 **Vuex** 管理全域狀態，Pinia 章節為建議導入與技術展示，不代表目前已完成遷移。

## 2. 技術使用總覽

| 技術 | 主要用途 | 目前專案狀態 | 現行使用位置 |
|---|---|---|---|
| props / emit | 父子元件資料傳遞與事件通知 | 已使用 | `FormField.vue`、`LoanRowsEditor.vue`、`LoanTotalsSummary.vue` |
| Vue Router | 頁面路由、程式導航、路由守衛 | 已使用 | `src/router/index.ts`、各 View |
| mock + Axios | 模擬後端資料、切換 mock／正式 API、發送 HTTP request | 已使用 | `server/mockApiServer.js`、`src/api`、`.env` |
| Pinia Store | 集中管理跨頁面全域狀態 | 尚未導入，目前使用 Vuex | 建議未來取代或逐步遷移 `src/store` |

## 3. 元件溝通：props / emit

### 3.1 核心概念

| 技術 | 資料方向 | 用途 |
|---|---|---|
| `props` | 父元件 → 子元件 | 將資料、設定或函式傳給子元件顯示與使用。 |
| `emit` | 子元件 → 父元件 | 通知父元件發生輸入、點擊、新增或刪除等事件。 |
| `v-model` | 父元件 ↔ 子元件 | Vue 將 `modelValue` prop 與 `update:modelValue` emit 組合成雙向綁定。 |

建議資料流：

```text
父元件保存業務資料
  ↓ props
子元件顯示資料與接收操作
  ↓ emit
父元件更新資料、執行驗證或呼叫 API
```

### 3.2 基本 TypeScript 範例

子元件 `FormField.vue`：

```vue
<script setup lang="ts">
defineProps<{
  label: string;
  modelValue: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();
</script>

<template>
  <label>
    <span>{{ label }}</span>
    <input
      :value="modelValue"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
  </label>
</template>
```

父元件使用：

```vue
<script setup lang="ts">
import { ref } from 'vue';
import FormField from './FormField.vue';

const userName = ref('');
</script>

<template>
  <FormField v-model="userName" label="使用者名稱" />
</template>
```

`v-model="userName"` 等同於：

```vue
<FormField
  :model-value="userName"
  @update:model-value="userName = $event"
/>
```

### 3.3 多事件元件範例

目前 `LoanRowsEditor.vue` 使用具名 emit 回報新增、刪除與欄位更新：

```ts
const emit = defineEmits<{
  add: [];
  remove: [index: number];
  'update-field': [payload: { index: number; field: LoanField; value: string }];
}>();

emit('remove', 0);
emit('update-field', {
  index: 0,
  field: 'currency',
  value: 'TWD'
});
```

父元件接收：

```vue
<LoanRowsEditor
  :loans="editableLoans"
  @add="addLoan"
  @remove="removeLoan"
  @update-field="updateLoanField"
/>
```

### 3.4 使用原則

| 建議 | 說明 |
|---|---|
| props 唯讀 | 子元件不應直接修改 props，應透過 emit 請父元件更新。 |
| emit 名稱表達操作 | 使用 `remove`、`update-field`，避免使用含意不明的 `change`。 |
| payload 使用型別 | 複雜事件應定義 payload 型別，避免欄位拼字錯誤。 |
| 業務邏輯留在父元件 | 子元件處理畫面與事件，API 呼叫及主要驗證由頁面或業務層負責。 |
| 跨多層共享改用 Store | 若資料需跨越多層元件或多個頁面，不適合持續逐層傳 props。 |

### 3.5 測試重點

| 測試項目 | 驗證方式 |
|---|---|
| props 是否正確顯示 | render 元件並檢查畫面文字或輸入值。 |
| emit 是否正確送出 | 操作輸入或按鈕，檢查 `wrapper.emitted()`。 |
| payload 型別與內容 | 驗證 emit 的 index、field、value。 |
| 父元件是否更新資料 | 使用 Testing Library 操作畫面後檢查畫面或儲存 payload。 |

## 4. 路由導航：Vue Router

### 4.1 核心概念

Vue Router 負責單頁應用程式的 URL 與 Vue 頁面元件對應。

| 技術 | 用途 |
|---|---|
| `createRouter` | 建立 Router 實例。 |
| `createWebHistory` | 使用 HTML5 history URL。 |
| `RouterLink` | 使用者點擊後進行宣告式導航。 |
| `useRouter` | 在程式流程中主動導航。 |
| `useRoute` | 讀取目前路由、params 與 query。 |
| `beforeEach` | 在進入頁面前執行權限或登入檢查。 |
| `RouterView` | 顯示目前路由對應的頁面元件。 |

### 4.2 建立路由

```ts
import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '../views/LoginView.vue';
import HomeView from '../views/HomeView.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'login',
      component: LoginView
    },
    {
      path: '/home',
      name: 'home',
      component: HomeView,
      meta: { requiresAuth: true }
    }
  ]
});

export default router;
```

### 4.3 RouterLink 宣告式導航

適合使用者直接點擊的頁面連結：

```vue
<RouterLink :to="{ name: 'register' }">
  前往註冊
</RouterLink>
```

需要保留按鈕外觀時：

```vue
<RouterLink :to="{ name: 'register' }" custom v-slot="{ navigate }">
  <button type="button" @click="navigate">註冊</button>
</RouterLink>
```

### 4.4 useRouter 程式導航

適合登入成功、存檔完成或登出後跳轉：

```ts
import { useRouter } from 'vue-router';

const router = useRouter();

async function submitLogin(): Promise<void> {
  await login();
  await router.push({ name: 'home' });
}
```

### 4.5 params 與 query

| 類型 | 範例 URL | 適用情境 |
|---|---|---|
| params | `/users/DEMO0001` | 資源識別碼，是路徑必要部分。 |
| query | `/exchange-rates?baseCurrency=TWD` | 篩選、顯示模式或可選條件。 |

傳入 query：

```ts
await router.push({
  name: 'exchangeRates',
  query: { baseCurrency: 'TWD' }
});
```

讀取 query：

```ts
import { useRoute } from 'vue-router';

const route = useRoute();
const baseCurrency = String(route.query.baseCurrency ?? 'TWD');
```

### 4.6 路由守衛

目前專案使用 `meta.requiresAuth` 判斷頁面是否需要登入：

```ts
router.beforeEach((to) => {
  if (to.meta.requiresAuth && !sessionStore.user) {
    return { name: 'login' };
  }

  return true;
});
```

注意：需要在新視窗直接開啟的公開頁面，例如匯率資訊頁，不應設定 `requiresAuth`，否則沒有原視窗 session 時會被導回登入頁。

### 4.7 使用原則

| 建議 | 說明 |
|---|---|
| 優先使用路由名稱 | `{ name: 'home' }` 比硬寫 `/home` 更容易維護。 |
| 使用者點擊用 RouterLink | 可保留瀏覽器連結語意及開新分頁能力。 |
| 流程完成後用 useRouter | 登入、註冊、登出等程式流程適合 `router.push()`。 |
| 權限集中於守衛 | 避免每個頁面重複撰寫登入判斷。 |
| 公開頁面需明確定義 | API 健康檢查與公開匯率頁需評估是否允許直接開啟。 |

## 5. 資料模擬與串接：mock + Axios

### 5.1 名詞說明

`mockaxios` 不是目前專案中的單一套件名稱，本文件將其拆成兩個概念：

| 概念 | 用途 | 目前專案作法 |
|---|---|---|
| mock API | 在正式後端尚未完成時，模擬 API URL、資料與錯誤情境。 | Express `server/mockApiServer.js` + 安全範例 JSON |
| Axios | 從 Vue3 前端發送 HTTP request。 | `src/api/client/httpClient.ts`、`request.ts` |
| Axios mock | 單元測試中模擬 Axios response，不實際連線。 | Vitest `vi.mock('axios')` 或注入 mock client |

### 5.2 mock API 流程

```text
Vue 頁面
  ↓ 呼叫業務 API
src/api/modules
  ↓
API Client / Axios
  ↓ VITE_USE_BACKEND_API=false
http://127.0.0.1:3001
  ↓
Express mock API
  ↓
server/*.json 安全範例資料
```

啟動 mock API 與前端：

```bash
npm run dev:full
```

### 5.3 使用環境參數切換 API

`.env`：

```env
VITE_USE_BACKEND_API=false
VITE_MOCK_API_BASE_URL=http://127.0.0.1:3001
VITE_BACKEND_API_BASE_URL=http://127.0.0.1:8080
VITE_API_TIMEOUT_MS=8000
```

| 設定 | API 來源 |
|---|---|
| `VITE_USE_BACKEND_API=false` | 呼叫本機 mock API `3001`。 |
| `VITE_USE_BACKEND_API=true` | 呼叫實際後端 API `8080`。 |

修改 `.env` 後必須重啟 Vite，否則前端仍可能使用舊設定。

### 5.4 Axios Client

```ts
import axios, { type AxiosInstance } from 'axios';

export function createApiClient(): AxiosInstance {
  return axios.create({
    baseURL: backendApiConfig.baseURL,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    timeout: backendApiConfig.timeout
  });
}
```

### 5.5 業務 API 呼叫

頁面不直接呼叫 Axios，而是呼叫業務 API：

```ts
export async function login(account: string, password: string): Promise<UserProfile> {
  const data = await requestEndpoint<ApiResponsePayload>('login', {
    data: { account, password }
  });

  assertSuccess(data);
  return normalizeUser(data, account);
}
```

好處：

| 好處 | 說明 |
|---|---|
| 頁面簡潔 | 頁面只關心登入成功或失敗，不處理 URL 與 Axios 細節。 |
| 統一錯誤 | 所有 API 使用相同錯誤轉換規則。 |
| 切換容易 | mock 與正式後端共用相同業務 API。 |
| 易於測試 | 可 mock Axios、API 模組或注入 HTTP Client。 |
| 可重用 | API SDK 與發票平台 API 已可打包成 `.tgz` 給其他專案使用。 |

### 5.6 Axios 單元測試模擬

```ts
const axiosMock = vi.hoisted(() => {
  const request = vi.fn();

  return {
    request,
    create: vi.fn(() => ({ request }))
  };
});

vi.mock('axios', () => ({
  default: {
    create: axiosMock.create
  }
}));

axiosMock.request.mockResolvedValue({
  data: {
    success: true,
    user: {
      account: 'DEMO0001',
      userName: '安全範例使用者'
    }
  }
});
```

測試時不會實際打到 `3001` 或 `8080`，可以穩定驗證 request method、URL、payload 與 response 處理。

### 5.7 使用原則

| 建議 | 說明 |
|---|---|
| mock 與正式 API 契約一致 | URL、method、request、response 欄位應盡量一致。 |
| mock 只能使用安全範例資料 | 不可放入真實帳密、個資或金融資料。 |
| 頁面不直接使用 Axios | 統一透過 API Client 與業務 API 層。 |
| 測試不依賴實際服務 | 單元測試應 mock Axios 或注入 Client。 |
| 整合測試再連實際 API | 使用 `/admin/api-health` 或指定流程驗證正式後端。 |

## 6. 全域狀態管理：Pinia Store

### 6.1 Pinia 是什麼

Pinia 是 Vue 官方建議的全域狀態管理工具，適合管理多個頁面或元件共同使用的資料，例如登入使用者、權限、購物車、系統設定與快取資料。

目前專案使用 Vuex：

```text
src/store/index.ts
src/stores/sessionStore.ts
```

若未來改用 Pinia，可用較簡潔的 Composition API 風格逐步取代 Vuex。

### 6.2 適合放入 Store 的資料

| 適合放入 Store | 不適合放入 Store |
|---|---|
| 登入使用者與權限 | 單一輸入框暫存值 |
| 多頁共用的系統設定 | 只在某一元件使用的開關 |
| 跨頁共用的查詢條件 | 純畫面 hover 狀態 |
| 需統一更新的業務資料 | 可由 props 傳入的簡單資料 |

### 6.3 安裝與掛載

安裝：

```bash
npm install pinia
```

在 `main.ts` 掛載：

```ts
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.mount('#app');
```

### 6.4 建立 Session Store

`src/stores/session.ts`：

```ts
import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import type { UserProfile } from '../types/loan';

export const useSessionStore = defineStore('session', () => {
  const user = ref<UserProfile | null>(null);
  const isLoggedIn = computed<boolean>(() => user.value !== null);

  function setUser(nextUser: UserProfile): void {
    user.value = nextUser;
  }

  function clear(): void {
    user.value = null;
  }

  return {
    user,
    isLoggedIn,
    setUser,
    clear
  };
});
```

### 6.5 頁面使用 Store

```ts
import { useSessionStore } from '../stores/session';

const sessionStore = useSessionStore();

async function submitLogin(): Promise<void> {
  const user = await login(account.value, password.value);
  sessionStore.setUser(user);
}

function logout(): void {
  sessionStore.clear();
}
```

模板可以直接使用：

```vue
<p>{{ sessionStore.user?.userName }}</p>
<button v-if="sessionStore.isLoggedIn" @click="logout">登出</button>
```

### 6.6 在路由守衛使用 Pinia

```ts
import { useSessionStore } from '../stores/session';

router.beforeEach((to) => {
  const sessionStore = useSessionStore();

  if (to.meta.requiresAuth && !sessionStore.isLoggedIn) {
    return { name: 'login' };
  }

  return true;
});
```

Pinia 必須先透過 `app.use(pinia)` 掛載；若在 Router 建立階段使用 Store，需注意 Pinia instance 的初始化順序。

### 6.7 Store 與 API 的分工

| 層級 | 責任 |
|---|---|
| API 模組 | 呼叫後端、處理 request／response、正規化資料。 |
| Pinia Store | 保存跨頁資料、統一狀態更新與共用 actions。 |
| Vue 頁面 | 處理使用者流程、顯示狀態與呼叫 Store action。 |
| 子元件 | 接收 props、送出 emit，不直接管理全域業務狀態。 |

Pinia action 也可包裝業務流程：

```ts
export const useSessionStore = defineStore('session', () => {
  const user = ref<UserProfile | null>(null);

  async function loginUser(account: string, password: string): Promise<void> {
    user.value = await login(account, password);
  }

  return {
    user,
    loginUser
  };
});
```

### 6.8 Pinia 與 Vuex 比較

| 比較項目 | Pinia | Vuex |
|---|---|---|
| Vue3 官方建議 | 是 | 可使用，但新專案通常優先 Pinia |
| TypeScript 體驗 | 較直覺 | 需要較多型別處理 |
| Mutation | 不需要 | 通常透過 mutation 修改 state |
| Composition API | 原生支援 | 可使用，但風格較傳統 |
| 模組拆分 | 每個 Store 自然拆分 | 通常使用 modules |
| 本專案狀態 | 尚未導入 | 目前正在使用 |

### 6.9 Pinia 測試範例

```ts
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { useSessionStore } from './session';

describe('session store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('可保存與清除使用者', () => {
    const store = useSessionStore();

    store.setUser({
      account: 'DEMO0001',
      userName: '安全範例使用者',
      loans: [],
      loanChangeLogs: []
    });

    expect(store.isLoggedIn).toBe(true);

    store.clear();
    expect(store.user).toBeNull();
  });
});
```

## 7. 技術整合流程範例

以登入流程為例：

```text
LoginView
  ├─ FormField：props 接收欄位設定，emit 回傳輸入值
  ├─ authApi.login：透過 Axios 呼叫 mock 或正式後端
  ├─ Pinia/Vuex Store：保存登入成功的使用者資料
  └─ Vue Router：登入成功後導航到首頁
```

| 序列 | 技術 | 登入流程用途 |
|---|---|---|
| 1 | props / emit | 共用輸入元件將帳號密碼回傳父元件。 |
| 2 | mock + Axios | 呼叫登入 API 並取得使用者資料。 |
| 3 | Pinia／Vuex Store | 保存登入後使用者資料供其他頁面使用。 |
| 4 | Vue Router | 登入成功後前往首頁，未登入時由守衛導回登入頁。 |

## 8. 技術選用判斷表

| 需求 | 建議技術 |
|---|---|
| 父元件傳資料給子元件 | props |
| 子元件通知父元件 | emit |
| 共用輸入元件雙向綁定 | `v-model` + `update:modelValue` |
| 使用者點擊頁面連結 | RouterLink |
| 登入成功後程式跳頁 | `useRouter().push()` |
| 讀取網址 query | `useRoute()` |
| 尚無正式後端但需展示功能 | Express mock API |
| 前端呼叫 HTTP API | Axios／API SDK |
| 單元測試 API 行為 | mock Axios 或注入 mock Client |
| 多頁共用登入資料 | Pinia Store；目前專案使用 Vuex |

## 9. 現行專案導入狀態與後續建議

| 項目 | 現行狀態 | 後續建議 |
|---|---|---|
| props / emit | 已導入且有實際元件 | 新增共用元件時維持 TypeScript props/emit 型別。 |
| Vue Router | 已導入路由名稱、RouterLink、程式導航與守衛 | 可再補 404 頁與 route lazy loading。 |
| mock + Axios | 已有 Express mock API、環境切換、API 分層與本地套件 | 可增加整合測試及 API 契約驗證。 |
| Pinia Store | 尚未導入，目前使用 Vuex | 新專案可直接使用 Pinia；本專案若遷移應分階段進行並補 Store 測試。 |
