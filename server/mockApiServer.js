// 匯入 CORS middleware，允許 Vue/Vite 前端呼叫此本機 API server。
import cors from 'cors';
// 匯入 Express，建立登入、註冊、首頁、放款更新與異動紀錄 API。
import express from 'express';
// 匯入 JSON 檔案讀寫工具，讓測試資料可以直接保存到 server 資料夾。
import { readFile, writeFile } from 'node:fs/promises';
// 匯入路徑工具，避免不同啟動位置造成 JSON 檔案路徑錯誤。
import { dirname, join } from 'node:path';
// 匯入 URL 工具，將 ESM 的 import.meta.url 轉為實體檔案路徑。
import { fileURLToPath } from 'node:url';

// 建立 Express app。
const app = express();
// API_PORT 可用環境變數覆蓋，未設定時使用 3001。
const port = Number(process.env.API_PORT ?? 3001);
// 取得目前 server 檔案所在目錄。
const serverDir = dirname(fileURLToPath(import.meta.url));

// 使用者帳密 JSON 檔路徑。
const credentialsFilePath = join(serverDir, 'user-credentials.json');
// 使用者基本資料 JSON 檔路徑。
const profilesFilePath = join(serverDir, 'user-profiles.json');
// 使用者放款資訊 JSON 檔路徑。
const loansFilePath = join(serverDir, 'user-loans.json');
// 使用者放款資訊異動紀錄 JSON 檔路徑。
const loanChangeLogsFilePath = join(serverDir, 'user-loan-change-logs.json');

// 啟用 CORS，讓 http://127.0.0.1:5173 前端可呼叫 http://127.0.0.1:3001。
app.use(cors());
// 啟用 JSON body parser，讓 POST/PUT 上行電文可用 req.body 取得。
app.use(express.json());

// 放款資訊欄位中文標籤，用於異動紀錄與錯誤訊息。
const loanFieldLabels = {
  loanAccount: '放款帳號',
  currency: '幣別',
  currentOutstandingAmount: '當前現欠金額',
  nextPaymentDate: '下期還款日期',
  nextPaymentAmount: '下期還款金額'
};

// 讀取 JSON 檔案並轉為 JavaScript 物件。
async function readJson(filePath) {
  const content = await readFile(filePath, 'utf-8');
  return JSON.parse(content);
}

// 將 JavaScript 物件格式化後寫回 JSON 檔案。
async function writeJson(filePath, data) {
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf-8');
}

// 將 users 陣列轉為 account -> item 的 Map，方便 API 快速查詢。
function mapByAccount(items) {
  return new Map(items.map((item) => [item.account, item]));
}

// 將放款資料正規化成 API 統一輸出的欄位型別。
function normalizeLoan(loan) {
  return {
    loanAccount: String(loan.loanAccount ?? '').trim(),
    currency: String(loan.currency ?? '').trim().toUpperCase(),
    currentOutstandingAmount: Number(loan.currentOutstandingAmount),
    nextPaymentDate: String(loan.nextPaymentDate ?? '').trim(),
    nextPaymentAmount: Number(loan.nextPaymentAmount)
  };
}

// 將日期時間格式化為需求指定的 YYYY/MM/DD HH:MM:SS。
function formatChangeTime(date = new Date()) {
  const pad = (value) => String(value).padStart(2, '0');

  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

// 將異動紀錄依異動時間倒敘排列，讓最新異動顯示在最上方。
function sortLogsDesc(logs) {
  return [...logs].sort((a, b) => String(b.changedAt).localeCompare(String(a.changedAt)));
}

// 檢核必填欄位，避免空資料或格式錯誤寫入 JSON 測試資料。
function validateLoans(nextLoans) {
  for (const [index, loan] of nextLoans.entries()) {
    const rowNumber = index + 1;
    const loanAccount = String(loan.loanAccount ?? '').trim();
    const currency = String(loan.currency ?? '').trim();
    const currentOutstandingAmount = loan.currentOutstandingAmount;
    const nextPaymentDate = String(loan.nextPaymentDate ?? '').trim();
    const nextPaymentAmount = loan.nextPaymentAmount;

    if (!loanAccount || !currency || currentOutstandingAmount === '' || currentOutstandingAmount === null) {
      return `第 ${rowNumber} 筆資料未完整輸入`;
    }

    if (!nextPaymentDate || nextPaymentAmount === '' || nextPaymentAmount === null) {
      return `第 ${rowNumber} 筆資料未完整輸入`;
    }

    if (!/^\d{13,}$/.test(loanAccount)) {
      return `第 ${rowNumber} 筆放款帳號需為 13 碼以上數字`;
    }

    if (!/^[A-Z]{3}$/.test(currency.toUpperCase())) {
      return `第 ${rowNumber} 筆幣別需為三碼英文`;
    }

    if (!Number.isFinite(Number(currentOutstandingAmount)) || !Number.isFinite(Number(nextPaymentAmount))) {
      return `第 ${rowNumber} 筆金額格式錯誤`;
    }

    if (!/^\d{8}$/.test(nextPaymentDate)) {
      return `第 ${rowNumber} 筆下期還款日期格式需為 yyyymmdd`;
    }
  }

  return '';
}

// 取得指定帳號的異動紀錄資料，若不存在則自動建立空陣列。
function getOrCreateLogRecord(account) {
  if (loanChangeLogs.has(account)) {
    return loanChangeLogs.get(account);
  }

  const record = { account, loanChangeLogs: [] };
  loanChangeLogsData.users.push(record);
  loanChangeLogs.set(account, record);

  return record;
}

// 將一筆放款資料轉成完整欄位陣列，方便新增與刪除紀錄完整呈現。
function toFullLoanChangeData(loan, valueKey) {
  return Object.entries(loanFieldLabels).map(([field, fieldName]) => ({
    loanAccount: loan.loanAccount,
    field,
    fieldName,
    [valueKey]: loan[field]
  }));
}

// 建立單筆異動紀錄。
function createChangeLog({ changedBy, changeItem, changeData }) {
  return {
    changedAt: formatChangeTime(),
    changedBy,
    changeItem,
    changeData
  };
}

// 比對存檔前後的放款資料，產生新增、刪除、修改異動紀錄。
function buildLoanChangeLogs(account, oldLoans, newLoans) {
  const changedBy = profiles.get(account)?.userName ?? `${account}使用者`;
  const oldMap = new Map(oldLoans.map((loan) => [loan.loanAccount, loan]));
  const newMap = new Map(newLoans.map((loan) => [loan.loanAccount, loan]));
  const logs = [];

  // 新增：完整保存新增後的全部欄位。
  newLoans.forEach((loan) => {
    if (!oldMap.has(loan.loanAccount)) {
      logs.push(
        createChangeLog({
          changedBy,
          changeItem: '新增',
          changeData: toFullLoanChangeData(loan, 'newValue')
        })
      );
    }
  });

  // 刪除：完整保存刪除前的全部欄位。
  oldLoans.forEach((loan) => {
    if (!newMap.has(loan.loanAccount)) {
      logs.push(
        createChangeLog({
          changedBy,
          changeItem: '刪除',
          changeData: toFullLoanChangeData(loan, 'oldValue')
        })
      );
    }
  });

  // 修改：同一筆放款有多個欄位異動時，全部集中在同一筆 JSON 陣列中。
  newLoans.forEach((loan) => {
    const oldLoan = oldMap.get(loan.loanAccount);

    if (!oldLoan) {
      return;
    }

    const changeData = Object.entries(loanFieldLabels)
      .filter(([field]) => String(oldLoan[field]) !== String(loan[field]))
      .map(([field, fieldName]) => ({
        loanAccount: loan.loanAccount,
        field,
        fieldName,
        oldValue: oldLoan[field],
        newValue: loan[field]
      }));

    if (changeData.length > 0) {
      logs.push(
        createChangeLog({
          changedBy,
          changeItem: '修改',
          changeData
        })
      );
    }
  });

  return logs;
}

// 讀取所有測試 JSON 檔案。
const credentialsData = await readJson(credentialsFilePath);
const profilesData = await readJson(profilesFilePath);
const loansData = await readJson(loansFilePath);
const loanChangeLogsData = await readJson(loanChangeLogsFilePath);

// 建立記憶體 Map，加速 API 查詢。
const credentials = mapByAccount(credentialsData.users);
const profiles = mapByAccount(profilesData.users);
const loans = mapByAccount(loansData.users);
const loanChangeLogs = mapByAccount(loanChangeLogsData.users);

// 組成前端需要的使用者下行資料。
function toPublicUser(account) {
  const profile = profiles.get(account);
  const loanRecord = loans.get(account);
  const logRecord = loanChangeLogs.get(account);

  return {
    account,
    userName: profile?.userName ?? `${account}使用者`,
    loans: loanRecord?.loans ?? [],
    loanChangeLogs: sortLogsDesc(logRecord?.loanChangeLogs ?? [])
  };
}

// 註冊時一次保存四個 JSON 檔案。
async function saveAllFiles() {
  await Promise.all([
    writeJson(credentialsFilePath, credentialsData),
    writeJson(profilesFilePath, profilesData),
    writeJson(loansFilePath, loansData),
    writeJson(loanChangeLogsFilePath, loanChangeLogsData)
  ]);
}

// 建立新註冊使用者，並同步建立空放款與空異動紀錄。
async function saveRegisteredUser(account, password, userName) {
  const credential = { account, password };
  const profile = { account, userName };
  const loanRecord = { account, loans: [] };
  const logRecord = { account, loanChangeLogs: [] };

  credentialsData.users.push(credential);
  profilesData.users.push(profile);
  loansData.users.push(loanRecord);
  loanChangeLogsData.users.push(logRecord);

  credentials.set(account, credential);
  profiles.set(account, profile);
  loans.set(account, loanRecord);
  loanChangeLogs.set(account, logRecord);

  await saveAllFiles();
}

// 保存放款資料，並依存檔前後差異自動寫入異動紀錄。
async function saveLoans(account, nextLoans) {
  const loanRecord = loans.get(account) ?? { account, loans: [] };
  const oldLoans = loanRecord.loans.map(normalizeLoan);
  const normalizedNextLoans = nextLoans.map(normalizeLoan);
  const generatedLogs = buildLoanChangeLogs(account, oldLoans, normalizedNextLoans);
  const logRecord = getOrCreateLogRecord(account);

  loanRecord.loans = normalizedNextLoans;

  if (!loans.has(account)) {
    loansData.users.push(loanRecord);
    loans.set(account, loanRecord);
  }

  if (generatedLogs.length > 0) {
    logRecord.loanChangeLogs = sortLogsDesc([...generatedLogs, ...logRecord.loanChangeLogs]);
  }

  await Promise.all([writeJson(loansFilePath, loansData), writeJson(loanChangeLogsFilePath, loanChangeLogsData)]);

  return {
    loans: loanRecord.loans,
    loanChangeLogs: logRecord.loanChangeLogs
  };
}

// 健康檢查 API，確認 API server 與 JSON 檔案位置。
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Mock API server is running',
    files: {
      credentials: credentialsFilePath,
      profiles: profilesFilePath,
      loans: loansFilePath,
      loanChangeLogs: loanChangeLogsFilePath
    }
  });
});

// 登入 API。
app.post('/login', (req, res) => {
  const { account, password } = req.body ?? {};
  const credential = credentials.get(account);

  if (!account || !password) {
    return res.status(400).json({ success: false, message: '帳密未輸入' });
  }

  if (!credential || credential.password !== password) {
    return res.status(401).json({ success: false, message: '帳密錯誤' });
  }

  return res.json({ success: true, user: toPublicUser(account) });
});

// 註冊 API。
app.post('/register', async (req, res) => {
  const { account, password, userName } = req.body ?? {};
  const normalizedUserName = String(userName ?? '').trim();

  if (!account || !password) {
    return res.status(400).json({ success: false, message: '帳密未輸入' });
  }

  if (normalizedUserName.length < 2) {
    return res.status(400).json({ success: false, message: '使用者名稱必須大於2長' });
  }

  if (account.length < 8 || password.length < 8) {
    return res.status(400).json({ success: false, message: '帳號及密碼長度需為 8 碼以上' });
  }

  if (credentials.has(account)) {
    return res.status(409).json({ success: false, message: '帳號已存在' });
  }

  await saveRegisteredUser(account, password, normalizedUserName);

  return res.status(201).json({ success: true, user: toPublicUser(account) });
});

// 查詢使用者首頁 JSON API。
app.get('/users/:account', (req, res) => {
  if (!profiles.has(req.params.account)) {
    return res.status(404).json({ success: false, message: '查無使用者' });
  }

  return res.json({ success: true, user: toPublicUser(req.params.account) });
});

// 查詢放款資訊異動紀錄 JSON API。
app.get('/users/:account/loan-change-logs', (req, res) => {
  if (!profiles.has(req.params.account)) {
    return res.status(404).json({ success: false, message: '查無使用者' });
  }

  const logRecord = getOrCreateLogRecord(req.params.account);

  return res.json({
    success: true,
    account: req.params.account,
    loanChangeLogs: sortLogsDesc(logRecord.loanChangeLogs)
  });
});

// 更新使用者放款資訊 API。
app.put('/users/:account/loans', async (req, res) => {
  const { account } = req.params;
  const nextLoans = req.body?.loans;

  if (!profiles.has(account)) {
    return res.status(404).json({ success: false, message: '查無使用者' });
  }

  if (!Array.isArray(nextLoans)) {
    return res.status(400).json({ success: false, message: '放款資訊格式錯誤' });
  }

  const validationMessage = validateLoans(nextLoans);

  if (validationMessage) {
    return res.status(400).json({ success: false, message: validationMessage });
  }

  const saved = await saveLoans(account, nextLoans);

  return res.json({
    success: true,
    user: {
      ...toPublicUser(account),
      loans: saved.loans,
      loanChangeLogs: saved.loanChangeLogs
    }
  });
});

// 啟動 API server，並保留 server 物件以便收到終止訊號時可正常關閉。
const apiServer = app.listen(port, () => {
  console.log(`Mock API server is running at http://127.0.0.1:${port}`);
  console.log(`Credentials JSON: ${credentialsFilePath}`);
  console.log(`Profiles JSON: ${profilesFilePath}`);
  console.log(`Loans JSON: ${loansFilePath}`);
  console.log(`Loan change logs JSON: ${loanChangeLogsFilePath}`);
  console.log('Demo login 1: account=DEMO0001 password=DemoPass123!');
  console.log('Demo login 2: account=DEMO0002 password=SamplePass456!');
});

// 保留 keep-alive timer，避免特定 Windows/npm 背景啟動方式提前結束 mock server。
const keepAliveTimer = setInterval(() => {}, 24 * 60 * 60 * 1000);

// 關閉 API server 前先清除 keep-alive timer。
function closeApiServer() {
  clearInterval(keepAliveTimer);
  apiServer.close(() => process.exit(0));
}

// 收到終止訊號時正常關閉 API server，避免下次重啟時 port 被占用。
process.on('SIGTERM', closeApiServer);
process.on('SIGINT', closeApiServer);
