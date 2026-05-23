// 匯入 Axios，所有 POST/PUT/GET API 都統一透過 Axios client 呼叫。
import axios from 'axios';

// 讀取 Vite 環境變數；若未設定，預設連到本機 mock API server。
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:3001';

// 建立共用 Axios client，統一設定 baseURL、JSON header 與逾時秒數。
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  },
  timeout: 8000
});

// 包裝 API 呼叫，將 Axios error 轉成畫面可直接顯示的 Error message。
async function requestJson(action) {
  try {
    const response = await action();
    return response.data;
  } catch (error) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    throw new Error('連線失敗');
  }
}

// 正規化放款資料，避免後端欄位缺漏時造成畫面錯誤。
function normalizeLoan(item) {
  return {
    loanAccount: item.loanAccount ?? '',
    currency: item.currency ?? '',
    currentOutstandingAmount: item.currentOutstandingAmount ?? '',
    nextPaymentDate: item.nextPaymentDate ?? '',
    nextPaymentAmount: item.nextPaymentAmount ?? ''
  };
}

// 正規化放款資訊異動紀錄，支援新版 changeData 與舊版 changeContent。
function normalizeChangeLog(item) {
  return {
    changedAt: item.changedAt ?? '',
    changedBy: item.changedBy ?? '',
    changeItem: item.changeItem ?? '',
    changeData: Array.isArray(item.changeData) ? item.changeData : [],
    changeContent: item.changeContent ?? ''
  };
}

// 正規化使用者資料，登入、註冊與更新放款資訊都會共用此處理。
function normalizeUser(data, fallbackAccount) {
  const user = data.user ?? data;
  const loans = user.loans ?? [];
  const loanChangeLogs = user.loanChangeLogs ?? [];

  return {
    account: user.account ?? fallbackAccount,
    userName: user.userName ?? '未知使用者',
    loans: Array.isArray(loans) ? loans.map(normalizeLoan) : [],
    loanChangeLogs: Array.isArray(loanChangeLogs) ? loanChangeLogs.map(normalizeChangeLog) : []
  };
}

// 統一檢查 API success 欄位，若為 false 就轉成例外流程。
function assertSuccess(data) {
  if (data.success === false) {
    throw new Error(data.message ?? '帳密錯誤');
  }
}

// 呼叫登入 API。
export async function login(account, password) {
  const data = await requestJson(() => apiClient.post('/login', { account, password }));
  assertSuccess(data);

  return normalizeUser(data, account);
}

// 呼叫註冊 API。
export async function register(account, password) {
  const data = await requestJson(() => apiClient.post('/register', { account, password }));
  assertSuccess(data);

  return normalizeUser(data, account);
}

// 呼叫放款資訊更新 API。
export async function updateLoans(account, loans) {
  const data = await requestJson(() =>
    apiClient.put(`/users/${encodeURIComponent(account)}/loans`, { loans })
  );
  assertSuccess(data);

  return normalizeUser(data, account);
}

// 呼叫放款資訊異動紀錄查詢 API。
export async function fetchLoanChangeLogs(account) {
  const data = await requestJson(() =>
    apiClient.get(`/users/${encodeURIComponent(account)}/loan-change-logs`)
  );
  assertSuccess(data);

  return Array.isArray(data.loanChangeLogs) ? data.loanChangeLogs.map(normalizeChangeLog) : [];
}
