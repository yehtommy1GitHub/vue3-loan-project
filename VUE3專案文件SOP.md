# VUE3 專案文件 SOP

最後更新時間：2026/06/03 14:24:20

## 1. 文件目的

本 SOP 依據目前 `vue3-loan-project` 的實際架構整理，提供 Vue3 + TypeScript 專案從建立、功能擴充、API 串接、測試、文件維護到版控上傳前檢查的標準流程。未來新增頁面、API、元件或文件時，應優先依照本 SOP 執行，避免流程遺漏、文件不同步或將本機產物誤上傳。

| 項目 | 說明 |
|---|---|
| 適用專案 | Vue3、Vite、TypeScript、Vue Router、Vuex、Axios、Vitest 前端專案 |
| 適用範圍 | 專案初始化、功能開發、API 模組建立、mock 資料維護、測試驗證、文件更新、GitHub 推送前檢查 |
| 不適用範圍 | 後端正式服務開發、真實資料庫設計、正式資安稽核、正式金融核心系統串接 |
| 核心原則 | 先讀規範、再建架構、功能與測試同步、文件即時更新、安全資料不可外洩 |

## 2. 文件與程式維護原則

| 原則 | 實務做法 | 對應本專案 |
|---|---|---|
| 文件先行 | 開發前先確認需求、現有文件與 AGENTS 規範。 | `AGENTS.md`、`README.md`、`前端程式清單.md`、`前端系統分析設計規格書.md` |
| TypeScript 優先 | Vue3 核心前端一律使用 TypeScript，函式需具備明確型別。 | `.vue` 使用 `<script setup lang="ts">`，工具與 API 使用 `.ts` |
| API 分層 | API 設定、HTTP Client、業務 API 分開維護。 | `src/api/config`、`src/api/client`、`src/api/modules` |
| mock 安全 | mock JSON 只能放安全範例資料，不可放真實帳密、個資或金融資料。 | `server/*.json` |
| 測試同步 | 功能新增或規則異動時，同步補單元測試。 | `src/views/*.test.ts`、`src/config/*.test.ts`、`src/utils/*.test.ts` |
| 文件同步 | 程式或流程異動時，同步更新必要文件。 | README、程式清單、系統分析設計規格書、本 SOP |
| 版控審慎 | 未收到明確指示不得推送 GitHub。 | 遵循 `AGENTS.md` |

## 3. 建立流程總覽

| 序列 | 階段 | 建立項目 | 主要產出 | 完成條件 |
|---|---|---|---|---|
| 1 | 需求確認 | 確認頁面、資料、API、驗證規則與文件要求。 | 需求摘要、驗收條件 | 需求可轉成頁面、API 與測試項目 |
| 2 | 規範讀取 | 讀取 `AGENTS.md`、既有 README、程式清單、系統分析設計規格書。 | 維護規則清單 | 清楚知道不可上傳項目與文件同步要求 |
| 3 | 專案骨架 | 建立 Vite + Vue3 + TypeScript 基礎架構。 | `src`、`vite.config.ts`、`tsconfig.json` | `npm run type-check` 可執行 |
| 4 | 路由與狀態 | 建立 Router、Vuex、session facade。 | `src/router`、`src/store`、`src/stores` | 頁面可依登入狀態導覽 |
| 5 | API 自建模組 | 拆分 API 設定層、Client 層、業務 API 層。 | `src/api/config`、`src/api/client`、`src/api/modules` | 頁面不直接處理 axios 細節 |
| 6 | mock API | 建立 Express mock server 與安全範例 JSON。 | `server/mockApiServer.js`、`server/*.json` | 本機可用 `npm run dev:api` 呼叫 mock |
| 7 | 頁面與元件 | 建立登入、註冊、首頁、維護頁、匯率頁、後台檢查頁。 | `src/views`、`src/components` | 功能符合驗收規則 |
| 8 | 驗證與格式 | 補表單檢核、資料正規化、錯誤訊息。 | validator、normalizer、型別 | 錯誤資料不會送出或破壞畫面 |
| 9 | 單元測試 | 依需求補測試案例。 | `*.test.ts` | `npm test` 通過 |
| 10 | 文件更新 | 更新 README、程式清單、系統分析設計規格書與 SOP。 | Markdown 文件 | 文件能反映最新架構與流程 |
| 11 | 建置驗證 | 執行 type-check、test、build。 | 驗證結果 | 三項指令皆通過 |
| 12 | 版控檢查 | 檢查 git 狀態、ignore、敏感資料與建置產物。 | 乾淨的提交候選 | 無 `.env`、`node_modules/`、`dist/` 等產物被加入 |

## 4. 專案初始化 SOP

| 步驟 | 操作項目 | 指令或檔案 | 注意事項 |
|---|---|---|---|
| 1 | 建立專案資料夾 | `C:\Users\tommy\Desktop\vue3-loan-project` | 路徑需固定，方便文件與測試指令一致。 |
| 2 | 建立 Vite Vue 專案 | `npm create vite@latest` 或既有骨架 | 新專案應選 Vue + TypeScript。 |
| 3 | 安裝依賴 | `npm install` | 依賴包不可上傳 GitHub。 |
| 4 | 建立 TypeScript 設定 | `tsconfig.json`、`env.d.ts` | Vue SFC 與 Vite env 需有型別宣告。 |
| 5 | 建立測試設定 | `vite.config.ts`、`src/test/setup.ts` | Vitest 使用 jsdom 與 Testing Library matcher。 |
| 6 | 建立 ignore 規則 | `.gitignore` | 必須排除 `node_modules/`、`dist/`、`.env`、coverage、暫存檔。 |

## 5. Vue3 前端架構 SOP

| 序列 | 架構項目 | 建立位置 | 現行用途 | 最佳化原則 |
|---|---|---|---|---|
| 1 | App 入口 | `src/main.ts` | 建立 Vue app、掛載 Router、Vuex 與全域樣式。 | 入口只做全域設定，不寫業務邏輯。 |
| 2 | 根元件 | `src/App.vue` | 顯示目前路由頁面。 | 保持簡潔，避免塞入頁面業務。 |
| 3 | 路由設定 | `src/router/index.ts` | 管理登入、註冊、首頁、放款維護、匯率、後台頁。 | 需要可直接開啟的頁面不得套用登入守衛。 |
| 4 | 狀態管理 | `src/store/index.ts`、`src/stores/sessionStore.ts` | 保存登入使用者 session。 | Vuex 管資料，facade 保留舊呼叫介面。 |
| 5 | 共用元件 | `src/components` | 表單欄位、放款列、總額摘要。 | 使用 props/emit，父層集中處理業務資料。 |
| 6 | 頁面元件 | `src/views` | 主要業務頁面。 | 頁面負責流程，資料呼叫交給 API 模組。 |
| 7 | 工具函式 | `src/utils` | 金額折算、頁面標題等純函式。 | 純函式需易測試，不依賴畫面狀態。 |
| 8 | 型別集中 | `src/types` | API、使用者、放款、匯率型別。 | 跨檔案共用資料契約不可散落在頁面內。 |

## 6. API 自建模組 SOP

| 分層序列 | 分層名稱 | 檔案位置 | 建立內容 | 擴充規則 |
|---|---|---|---|---|
| 1 | API 設定層 | `src/api/config/backendApiConfig.ts` | API 模式、base URL、timeout、端點 method、URL、中文名稱、健康檢查設定。 | 新增 API 時先在此新增 endpoint 設定。 |
| 2 | API Client 層 | `src/api/client/httpClient.ts` | 建立共用 Axios instance。 | 不寫業務 API，只處理 HTTP client 共通設定。 |
| 3 | API Client 層 | `src/api/client/request.ts` | 端點解析、request 執行、錯誤訊息、success 欄位檢查。 | 所有業務 API 應透過此層送出請求。 |
| 4 | 業務 API 層 | `src/api/modules/*.ts` | 登入、註冊、使用者、放款、匯率、健康檢查等 API。 | 一個模組負責一類業務，不混入畫面邏輯。 |
| 5 | Response 正規化 | `src/api/modules/normalizers.ts` | 將後端 response 補預設值並轉成前端穩定型別。 | 後端欄位可缺漏，但畫面取得的資料結構需穩定。 |
| 6 | 統一匯出 | `src/api/index.ts` | 集中匯出 config、client、business API。 | 其他專案重用時優先從此入口引用。 |
| 7 | 相容舊路徑 | `src/config`、`src/services` | 舊路徑 re-export。 | 僅供過渡，新功能不得再新增 service 邏輯。 |

## 7. mock API 與安全資料 SOP

| 序列 | 項目 | 檔案 | 操作規則 | 檢查方式 |
|---|---|---|---|---|
| 1 | mock server | `server/mockApiServer.js` | mock server 非 Vue3 核心專案，可保留 JavaScript。 | `npm run dev:api` |
| 2 | 帳密資料 | `server/user-credentials.json` | 只放安全範例帳密。 | 檢查是否有真實帳號、電話、Email、身分證等資料。 |
| 3 | 使用者資料 | `server/user-profiles.json` | 只放示範名稱。 | 避免可識別真實個資。 |
| 4 | 放款資料 | `server/user-loans.json` | 使用安全範例發票號碼與金額。 | 發票號碼需符合 13 碼數字規則。 |
| 5 | 異動紀錄 | `server/user-loan-change-logs.json` | 記錄安全範例異動內容。 | 欄位名稱需與畫面顯示一致。 |
| 6 | 匯率資料 | mock API response | 提供本位幣、更新時間與匯率表。 | 首頁、維護頁、匯率頁需可共用。 |

## 8. 功能建立 SOP

| 序列 | 功能類型 | 標準流程 | 必要產出 |
|---|---|---|---|
| 1 | 新增頁面 | 建立 route、view、必要元件、測試案例、文件說明。 | `src/router/index.ts`、`src/views/*.vue`、`*.test.ts` |
| 2 | 新增 API | 更新 API 設定層、建立業務 API 函式、補 response 型別與 normalizer、補測試。 | `src/api/config`、`src/api/modules`、`src/types` |
| 3 | 新增表單欄位 | 更新 Vue component、驗證規則、payload、mock API、測試與文件。 | 頁面、API、mock JSON、測試、文件 |
| 4 | 新增共用元件 | 先定義 props/emit 型別，再由父層接資料流。 | `src/components/*.vue` |
| 5 | 新增計算邏輯 | 抽到 `src/utils` 純函式並補單元測試。 | util 函式、測試案例 |
| 6 | 新增環境參數 | 更新 `.env.example`、API 設定層、README 說明。 | `.env.example`、README |

## 9. 文件更新 SOP

| 序列 | 文件 | 更新時機 | 必填內容 |
|---|---|---|---|
| 1 | `README.md` | 啟動方式、API 模式、測試方式、版控流程、主要架構異動時。 | 最後更新時間、架構摘要、操作指令、驗證結果。 |
| 2 | `前端程式清單.md` | 新增、刪除、改名程式或文件時。 | 版本記錄、檔案用途、Vue3 技術使用矩陣。 |
| 3 | `前端系統分析設計規格書.md` | 需求、流程、API、驗收規格改變時。 | 版本記錄、業務範圍、API 電文、驗收測試。 |
| 4 | `VUE3專案文件SOP.md` | 專案建立流程或維護流程調整時。 | SOP 版本、流程表、檢查清單。 |
| 5 | `AGENTS.md` | 專案維護規範本身變更時。 | 技術類型、文件項目、版控與維護規範。 |

## 10. 驗證 SOP

| 序列 | 驗證項目 | 指令 | 通過標準 |
|---|---|---|---|
| 1 | TypeScript 型別檢查 | `npm run type-check` | `vue-tsc --noEmit` 無錯誤。 |
| 2 | 單元測試 | `npm test` | 所有測試檔與測試案例通過。 |
| 3 | Production build | `npm run build` | Vite build 成功，`dist/` 產出但不得提交。 |
| 4 | API 模式檢查 | 開啟 `/admin/api-health` | API 模式、Base URL、端點狀態符合目前 `.env`。 |
| 5 | 瀏覽器實測 | 使用 in-app browser 或本機瀏覽器 | 需求指定流程可實際操作成功。 |

文件-only 異動可不強制執行完整測試，但應確認 Markdown 內容、檔名、版本記錄與必要文件同步完成；若文件描述到最新驗證結果，必須以實際執行結果為準。

## 11. GitHub 版控 SOP

| 序列 | 檢查項目 | 指令或做法 | 通過標準 |
|---|---|---|---|
| 1 | 查看變更 | `git status` | 清楚知道本次新增與修改檔案。 |
| 2 | 檢查 ignore | `git status --ignored`、`git check-ignore -v node_modules dist` | `node_modules/`、`dist/`、`.env` 等產物不會被提交。 |
| 3 | 檢查敏感資料 | 人工檢查 `.env`、`server/*.json` | 無真實帳密、個資、金融資料。 |
| 4 | 執行驗證 | `npm run type-check`、`npm test`、`npm run build` | 指令皆通過，或文件-only 明確註記未執行原因。 |
| 5 | 提交 | `git add .`、`git commit -m "..."` | commit message 清楚描述本次異動。 |
| 6 | 推送 | `git push` | 只有收到明確指示才可推送 GitHub。 |

不得上傳項目：

| 類型 | 不可上傳內容 |
|---|---|
| 依賴包 | `node_modules/` |
| 建置產物 | `dist/` |
| 環境設定 | `.env`、`.env.local`、`.env.*.local` |
| 測試產物 | `coverage/` |
| 暫存檔 | `.vite/`、系統暫存檔 |

## 12. 每次需求異動標準序列

| 序列 | 動作 | 判斷重點 |
|---|---|---|
| 1 | 讀取最新需求 | 確認使用者最新訊息是否改變方向。 |
| 2 | 讀取相關程式與文件 | 不憑印象修改，先看現有架構。 |
| 3 | 判斷是否需更新 API、型別、測試 | 資料契約改變時三者通常都需同步。 |
| 4 | 小範圍實作 | 優先遵循既有模式，不做無關重構。 |
| 5 | 補中文註解 | 業務流程、資料流與重要判斷需清楚說明。 |
| 6 | 補測試 | 欄位驗證、API payload、路由與畫面行為需覆蓋。 |
| 7 | 更新文件 | README、程式清單、系統分析設計規格書、本 SOP 視異動內容更新。 |
| 8 | 執行驗證 | type-check、test、build 或文件-only 檢查。 |
| 9 | 回報結果 | 說明改了什麼、驗證結果、未執行項目與原因。 |
| 10 | 等待推送指示 | 未收到明確指示不得上 GitHub。 |

## 13. 常見風險與預防

| 風險 | 可能原因 | 預防方式 |
|---|---|---|
| API 模式誤判 | `.env` 修改後未重啟 Vite，或有多個前端行程。 | 修改 `.env` 後停止舊行程並重啟 `npm run dev`。 |
| 後端與 mock 混淆 | 8080 後端與 3001 mock port 不同。 | 後台檢查頁確認 API 模式與 Base URL。 |
| 文件不同步 | 只改程式未改文件。 | 每次異動依第 9 節文件更新 SOP 檢查。 |
| 型別失控 | API response 型別散落在頁面。 | 統一放入 `src/types` 與 `src/api/modules/normalizers.ts`。 |
| 測試漏補 | 新規則只靠手動測試。 | 新增驗證規則時同步補 `*.test.ts`。 |
| 產物誤提交 | `dist/` 或 `.env` 未排除。 | 使用 `.gitignore` 與推送前檢查。 |

## 14. SOP 版本記錄

| 版本 | 時間 | 更新內容 | 維護者 |
|---|---|---|---|
| 1.0 | 2026/06/03 14:24:20 | 依據現行 Vue3 專案建立文件 SOP，整理專案建立、API 分層、mock、安全資料、測試、文件與版控流程。 | Codex |
