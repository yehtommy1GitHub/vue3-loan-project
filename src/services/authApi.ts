// 匯入 Axios，所有 POST/PUT/GET API 都統一透過 Axios client 呼叫。
import axios, { AxiosError } from 'axios';
// 匯入 API 參數檔，統一決定走 mock API 或實際後端 API，並集中管理 URL 與 method。
import { backendApiConfig, resolveBackendApiEndpoint } from '../config/backendApiConfig';
import type { AxiosMethod, EndpointParams } from '../types/api';
import type { ExchangeRatesResponse, Loan, LoanChangeLog, UserProfile } from '../types/loan';

// 建立共用 Axios client，baseURL 與 timeout 由 backendApiConfig 統一提供。
const apiClient = axios.create({
  baseURL: backendApiConfig.baseURL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  },
  timeout: backendApiConfig.timeout
});

// 包裝 API 呼叫，將 Axios error 轉成畫面可直接顯示的 Error message。
interface ApiResponsePayload {
  success?: boolean;
  message?: string;
  user?: Partial<UserProfile>;
  account?: string;
  userName?: string;
  loans?: Loan[];
  loanChangeLogs?: LoanChangeLog[];
  baseCurrency?: string;
  updatedAt?: string;
  rates?: Record<string, number>;
}

interface RequestEndpointOptions {
  params?: EndpointParams;
  data?: Record<string, unknown>;
}

async function requestJson(action: () => Promise<{ data: ApiResponsePayload }>) {
  try {
    const response = await action();
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<{ message?: string }>;

    if (axiosError.response?.data?.message) {
      throw new Error(axiosError.response.data.message);
    }

    throw new Error('連線失敗');
  }
}

// 依參數檔呼叫 API，避免 service 內散落 URL 與 HTTP method。
async function requestEndpoint(endpointName: string, { params = {}, data }: RequestEndpointOptions = {}) {
  if (backendApiConfig.configError) {
    throw new Error(backendApiConfig.configError);
  }

  const endpoint = resolveBackendApiEndpoint(endpointName, params);

  return requestJson(() => {
    if (['post', 'put', 'patch'].includes(endpoint.method)) {
      return apiClient[endpoint.method](endpoint.url, data);
    }

    return apiClient[endpoint.method as Exclude<AxiosMethod, 'post' | 'put' | 'patch'>](endpoint.url);
  });
}

// 正規化放款資料，避免後端欄位缺漏時造成畫面錯誤。
function normalizeLoan(item: Partial<Loan>): Loan {
  return {
    loanAccount: item.loanAccount ?? '',
    currency: item.currency ?? '',
    currentOutstandingAmount: item.currentOutstandingAmount ?? '',
    nextPaymentDate: item.nextPaymentDate ?? '',
    nextPaymentAmount: item.nextPaymentAmount ?? ''
  };
}

// 正規化發票放款資訊異動紀錄，支援新版 changeData 與舊版 changeContent。
function normalizeChangeLog(item: Partial<LoanChangeLog>): LoanChangeLog {
  return {
    changedAt: item.changedAt ?? '',
    changedBy: item.changedBy ?? '',
    changeItem: item.changeItem ?? '',
    changeData: Array.isArray(item.changeData) ? item.changeData : [],
    changeContent: item.changeContent ?? ''
  };
}

// 正規化使用者資料，登入、註冊與更新發票放款資訊都會共用此處理。
function normalizeUser(data: ApiResponsePayload, fallbackAccount: string): UserProfile {
  const user = data.user ?? data;
  const loans = user.loans ?? [];
  const loanChangeLogs = user.loanChangeLogs ?? [];

  return {
    account: user.account ?? fallbackAccount,
    userName: user.userName ?? '未知使用者',
    loans: Array.isArray(loans) ? loans.map((loan) => normalizeLoan(loan)) : [],
    loanChangeLogs: Array.isArray(loanChangeLogs) ? loanChangeLogs.map((log) => normalizeChangeLog(log)) : []
  };
}

// 統一檢查 API success 欄位，若為 false 就轉成例外流程。
function assertSuccess(data: ApiResponsePayload) {
  if (data.success === false) {
    throw new Error(data.message ?? '帳密錯誤');
  }
}

// 呼叫登入 API。
export async function login(account: string, password: string): Promise<UserProfile> {
  const data = await requestEndpoint('login', { data: { account, password } });
  assertSuccess(data);

  return normalizeUser(data, account);
}

// 呼叫註冊 API，使用者名稱由註冊頁輸入並傳給 mock API 寫入 profile JSON。
export async function register(account: string, password: string, userName: string): Promise<UserProfile> {
  const data = await requestEndpoint('register', { data: { account, password, userName } });
  assertSuccess(data);

  return normalizeUser(data, account);
}

// 呼叫使用者資料查詢 API，首頁 onMounted 會用它同步最新放款與異動紀錄。
export async function fetchUser(account: string): Promise<UserProfile> {
  const data = await requestEndpoint('fetchUser', { params: { account } });
  assertSuccess(data);

  return normalizeUser(data, account);
}

// 呼叫 mock 匯率 API，提供首頁與放款更新頁做不同幣別加總折算。
export async function fetchExchangeRates(): Promise<ExchangeRatesResponse> {
  const data = await requestEndpoint('fetchExchangeRates');
  assertSuccess(data);

  return {
    baseCurrency: data.baseCurrency ?? 'TWD',
    updatedAt: data.updatedAt ?? '',
    rates: data.rates ?? {}
  };
}

// 呼叫發票放款資訊更新 API。
export async function updateLoans(account: string, loans: Loan[]): Promise<UserProfile> {
  const data = await requestEndpoint('updateLoans', { params: { account }, data: { loans } });
  assertSuccess(data);

  return normalizeUser(data, account);
}

// 呼叫發票放款資訊異動紀錄查詢 API。
export async function fetchLoanChangeLogs(account: string): Promise<LoanChangeLog[]> {
  const data = await requestEndpoint('fetchLoanChangeLogs', { params: { account } });
  assertSuccess(data);

  return Array.isArray(data.loanChangeLogs) ? data.loanChangeLogs.map(normalizeChangeLog) : [];
}
