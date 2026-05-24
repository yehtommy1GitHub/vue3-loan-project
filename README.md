# Vue3 貸款資料示範系統

最後更新時間：2026/05/25 01:28:46

本專案是一個 Vue3 + Vite 的前端示範系統，搭配 Express mock API 與 JSON 檔案模擬後端資料。主要功能包含登入、註冊、使用者名稱建立、會員首頁、貸款資料顯示、貸款資料異動與異動紀錄查詢。

## 技術棧

- Vue 3
- Vue Router
- Axios
- Vite
- Express
- JSON mock data
- Vitest
- Testing Library Vue

## 專案結構

```txt
src/
  App.vue
  main.js
  router/index.js
  components/
  services/authApi.js
  stores/sessionStore.js
  utils/currencyTotals.js
  styles/main.css
  views/
server/
  mockApiServer.js
  user-credentials.json
  user-profiles.json
  user-loans.json
  user-loan-change-logs.json
```

## 安裝與啟動

安裝依賴：

```bash
npm install
```

同時啟動 Vue 前端與 mock API：

```bash
npm run dev:full
```

服務位置：

- 前端：http://127.0.0.1:5173/
- Mock API：http://127.0.0.1:3001/

## 安全範例帳號

以下帳號僅供本機示範與測試使用，不代表真實使用者：

```txt
帳號：DEMO0001
密碼：DemoPass123!
```

```txt
帳號：DEMO0002
密碼：SamplePass456!
```

## API 清單

| 方法 | 路徑 | 用途 |
|---|---|---|
| POST | `/login` | 使用帳號密碼登入 |
| POST | `/register` | 建立範例使用者，註冊時需傳入使用者名稱 |
| GET | `/users/{account}` | 查詢使用者、貸款與異動紀錄 |
| PUT | `/users/{account}/loans` | 更新使用者貸款資料 |
| GET | `/users/{account}/loan-change-logs` | 查詢貸款異動紀錄 |
| GET | `/exchange-rates` | 模擬查詢匯率資料，供放款總額折算使用 |

## 放款總額折算

首頁與放款資訊更新頁會顯示「總現欠金額」與「總還款金額」。系統會透過 `GET /exchange-rates` 取得模擬匯率，依每筆放款幣別折算後加總，並可用旁邊的幣別下拉選單快速切換目標幣別。

前端使用 `reactive` 集中管理總額折算狀態，包含目前目標幣別、匯率資料、讀取中狀態與錯誤訊息；金額計算則集中在 `src/utils/currencyTotals.js`，方便未來改接正式匯率 API。

總幣別下拉式選單旁提供「當前匯率資訊」入口，會另開新視窗或新分頁顯示 `/exchange-rates` 匯率資訊頁，方便使用者保留原放款頁面同步比對。匯率資訊頁不依賴原視窗的 Vuex session，因此新視窗可直接停留在匯率資訊頁，不會被路由守衛導回其他頁面。匯率資訊頁包含本位幣幣別下拉選單、匯率更新時間與各幣別匯率比值表格；直接進入時預設本位幣為 TWD，從總額區進入時會帶入目前選擇的總幣別。

## 註冊頁規則

註冊頁需輸入帳號、使用者名稱與密碼。使用者名稱會寫入 `server/user-profiles.json`，首頁顯示的名稱以註冊頁輸入值為準，不再由後端用帳號產生預設名稱。

欄位檢核：

- 帳號、使用者名稱、密碼皆為必填。
- 使用者名稱長度需至少 2 個字元；不足時顯示紅字訊息：`使用者名稱必須大於2長`。
- 帳號與密碼長度需為 8 碼以上。

註冊 API request 範例：

```json
{
  "account": "NEWUSER1",
  "userName": "王小明",
  "password": "DemoPass123!"
}
```

## 測試與建置

執行單元測試：

```bash
npm test
```

執行 production build：

```bash
npm run build
```

本次驗證結果：

- `npm test`：6 個測試檔、28 個測試案例通過。
- `npm run build`：Vite production build 成功。
- 實際網頁操作驗證通過：註冊頁可輸入使用者名稱；1 字元使用者名稱會顯示 `使用者名稱必須大於2長`；2 字元以上使用者名稱可註冊成功並於首頁顯示。
- 放款資訊與放款資訊更新頁可顯示總現欠金額、下期總還款金額，並可透過幣別下拉選單折算指定幣別。

## Git / GitHub 版控流程

遠端 GitHub 倉庫：

```txt
git@github.com:yehtommy1GitHub/vue3-loan-project.git
```

### 本次上傳操作紀錄

操作時間：2026/05/24 02:29:19

1. 初始化本機 Git 倉庫。
2. 新增 `.gitignore`，排除 `node_modules/`、`dist/`、環境檔、coverage 與 Vite 暫存目錄。
3. 將 mock 帳密與 mock 資料改為安全範例資料。
4. 將 `README.md`、`程式清單.md`、`系統分析設計規格書.md`、`AGENTS.md` 重寫為乾淨 UTF-8 中文內容。
5. 執行 `npm test`，確認 4 個測試檔、21 個測試案例通過。
6. 執行 `npm run build`，確認 Vite production build 成功。
7. 使用 `git commit --amend` 改寫尚未推送的初始提交，確保 Git 歷史只保留清理後的安全範例資料。
8. 設定 GitHub 遠端倉庫 `origin`。
9. 推送時遇到 `Host key verification failed`，依 GitHub 官方 SSH fingerprint 文件加入 `github.com` ED25519 host key。
10. 推送時遇到 `Permission denied (publickey)`，確認本機尚未有可用 GitHub SSH key。
11. 產生本機 GitHub SSH key，public key 檔案為 `C:\Users\tommy\.ssh\id_ed25519.pub`。
12. 將 public key 新增到 GitHub 帳號的 `SSH and GPG keys`。
13. 執行 `ssh -T git@github.com`，確認顯示 `Hi yehtommy1GitHub! You've successfully authenticated`。
14. 最後執行 `git push -u origin main` 將 `main` 分支推送到 GitHub。

### SSH Key 建立流程

建立 SSH key：

```powershell
ssh-keygen --% -t ed25519 -C yehommy1@gmail.com -f C:\Users\tommy\.ssh\id_ed25519 -N ""
```

讀取 public key，貼到 GitHub：

```powershell
Get-Content C:\Users\tommy\.ssh\id_ed25519.pub
```

GitHub 設定位置：

```txt
GitHub 右上角頭像 → Settings → SSH and GPG keys → New SSH key
```

測試 SSH 連線：

```bash
ssh -T git@github.com
```

成功訊息範例：

```txt
Hi yehtommy1GitHub! You've successfully authenticated, but GitHub does not provide shell access.
```

### SSH Host Key 處理

若推送時出現：

```txt
Host key verification failed.
```

需確認 GitHub 官方 SSH host key fingerprint，再加入 `known_hosts`。本次使用 GitHub 官方文件提供的 ED25519 host key：

```txt
github.com ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOMqqnkVzrm0SdG6UOoqKLsabgH5C9okWi0dh2l9GKJl
```

官方文件：

```txt
https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/githubs-ssh-key-fingerprints
```

### 常見推送錯誤

`Permission denied (publickey)`：

- 代表 GitHub 尚未接受本機 SSH key。
- 確認 public key 已加入 GitHub 帳號。
- 確認 `ssh -T git@github.com` 可成功顯示 GitHub 帳號名稱。

`Host key verification failed`：

- 代表本機尚未信任 GitHub SSH host key。
- 需比對 GitHub 官方 fingerprint 後再加入 `known_hosts`。

### 不上傳到 GitHub 的內容

以下內容屬於依賴包、建置產物或本機環境設定，已由 `.gitignore` 排除：

```txt
node_modules/
dist/
.env
.env.local
.env.*.local
coverage/
.vite/
```

### 首次建立版控流程

```bash
git init
git branch -M main
git add .
git commit -m "Initial Vue3 loan project"
git remote add origin git@github.com:yehtommy1GitHub/vue3-loan-project.git
git push -u origin main
```

### 後續更新流程

```bash
npm test
npm run build
git status
git add .
git commit -m "說明本次修改內容"
git push
git tag -a s.20260524.3 -m "穩定版本"
git tag
git push origin s.20260524.3
```

### 推送前檢查

```bash
git status --ignored
git check-ignore -v node_modules dist
```

推送前需確認：

- `node_modules/` 與 `dist/` 顯示為 ignored。
- `server/*.json` 只包含安全範例資料，不含真實帳密、個資或金融資料。
- `.env` 不會被加入版本控管。

## 本次版控狀態

- 已完成本機 Git 初始化。
- 已完成初始提交：`117cb23 Initial Vue3 loan project`。
- 已設定遠端倉庫：`origin git@github.com:yehtommy1GitHub/vue3-loan-project.git`。
- 已將 mock 帳密與資料改為安全範例。
- `node_modules/`、`dist/` 已排除，不會上傳 GitHub。

## 2026/05/24 03:17:13 Vue3 技術導入重構紀錄

本次依據 Vue3 技術盤點建議導入以下項目，目標是在專案規模擴大前先降低後續重構成本。

| 技術 | 導入位置 | 實務用途 |
|---|---|---|
| Vuex | `src/store/index.js`、`src/stores/sessionStore.js`、`src/main.js` | 集中管理登入後使用者 session，保留 `sessionStore` facade 讓既有頁面不用一次大量改寫。 |
| props / emit | `src/components/FormField.vue`、`src/components/LoanRowsEditor.vue` | 將輸入欄位與放款列編輯拆成可重用元件，父層集中處理業務資料。 |
| RouterLink | `LoginView.vue`、`RegisterView.vue`、`HomeView.vue` | 將單純頁面導覽改為 RouterLink custom slot，仍保留原本 button 視覺。 |
| onMounted | `HomeView.vue` | 首頁載入後以 `GET /users/{account}` 同步最新使用者、放款與異動紀錄；登出時避免慢回應覆蓋空 session。 |
| vee-validate | `RegisterView.vue` | 管理註冊表單欄位與驗證，包含帳密必填、帳密 8 碼以上、使用者名稱 2 長以上。 |
| vue-next-select | `LoanRowsEditor.vue` | 將幣別欄位改為可搜尋、可擴充的下拉選單，適合未來幣別選項增加。 |

驗證流程：
```bash
npm test
npm run build
```

驗證結果：
- `npm test`：4 個測試檔、22 個測試案例全數通過。
- `npm run build`：Vite production build 成功。
- in-app browser 實測：註冊頁使用者名稱不足 2 長會提示；註冊成功進首頁；首頁可進 `/loans`；新增放款列後幣別下拉元件正常出現。

注意：本次只完成本機重構與驗證，尚未上傳 GitHub；依 `AGENTS.md`，需收到明確指示後才 push。

## 2026/05/24 20:16:14 放款更新驗證強化

本次調整放款資訊更新頁 `/loans` 的前端輸入與存檔驗證：
- 放款帳號輸入時只保留數字，最多 13 碼。
- 存檔時放款帳號必須剛好 13 碼數字。
- 同一批放款資料的放款帳號不可重複。
- 當前現欠金額必須大於等於下期還款金額。

驗證結果：
- `npm test`：4 個測試檔、25 個測試案例全數通過。

## 2026/05/24 商業簡報交付

本次新增業主報告用 PDF 與可調整 HTML 來源檔：

- `Vue3放款服務平台_業主價值簡報.pdf`
- `Vue3放款服務平台_業主價值簡報.html`

簡報主軸依照 3S 原則撰寫：

- Story 故事：從放款資料維護不確定、人工確認成本高的現場痛點切入。
- Surprise 驚喜：說明目前 Vue3 前端、API service、Express mock API、JSON mock data 與測試已形成可展示且可演進的服務雛形，並加入操作流程簡圖與資料流簡圖，協助業主快速理解系統運作。
- Service 服務：提出試辦驗證、正式串接、營運治理三階段服務藍圖，協助業主理解後續上線與擴充路徑。

後續若需調整簡報內容，可先修改 HTML 來源檔，再重新輸出 PDF。

## 2026/05/24 20:40:19 幣別下拉選單顯示修正

放款資訊更新頁修正 `vue-next-select` 幣別下拉選單被表格外層裁切、可點擊範圍過小的問題：
- 放款更新頁表格外層改為允許下拉清單向外展開。
- 幣別下拉清單提高 z-index，避免被表格或其他欄位遮住。
- 下拉選單增加可視高度、陰影與每列點擊高度，讓 USD/TWD/JPY/SGD/EUR/GBP/AUD/CAD/CNY/HKD 都能正常檢視與點選。

驗證結果：
- `npm test`：4 個測試檔、25 個測試案例全數通過。
- `npm run build`：Vite production build 成功。
- in-app browser 實測：幣別下拉展開後可看到 10 個幣別選項，清單高度約 262px，可捲動且未被表格裁切。
