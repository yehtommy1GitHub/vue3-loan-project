# Vue3 貸款資料示範系統

最後更新時間：2026/05/24 02:53:00

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
  services/authApi.js
  stores/sessionStore.js
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

- `npm test`：4 個測試檔、22 個測試案例通過。
- `npm run build`：Vite production build 成功。
- 實際網頁操作驗證通過：註冊頁可輸入使用者名稱；1 字元使用者名稱會顯示 `使用者名稱必須大於2長`；2 字元以上使用者名稱可註冊成功並於首頁顯示。

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
