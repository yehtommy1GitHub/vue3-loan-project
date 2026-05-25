// API 連線模式旗標：FALSE 走本機 mock API，TRUE 走實際後端 API。
// Vite 環境變數皆為字串，因此統一轉大寫後判斷 TRUE。
const useBackendApi = String(import.meta.env.VITE_USE_BACKEND_API ?? 'false').trim().toUpperCase() === 'TRUE';

// mock API 與實際後端 API 分開設定，未來只要替換 .env 或此檔案即可切換目標服務。
const mockBaseURL = import.meta.env.VITE_MOCK_API_BASE_URL
  ?? import.meta.env.VITE_API_BASE_URL
  ?? 'http://127.0.0.1:3001';
const backendBaseURL = import.meta.env.VITE_BACKEND_API_BASE_URL ?? '';
const configError = useBackendApi && !backendBaseURL ? 'VITE_BACKEND_API_BASE_URL 未設定，無法連接實際後端 API' : '';

// 後端 API 參數集中管理；method 保留 HTTP 原始大寫格式，呼叫前再轉成 axios 可用的小寫方法。
export const backendApiConfig = {
  useBackendApi,
  mode: useBackendApi ? 'backend' : 'mock',
  baseURL: useBackendApi ? backendBaseURL : mockBaseURL,
  configError,
  timeout: Number(import.meta.env.VITE_API_TIMEOUT_MS ?? 8000),
  endpoints: {
    login: {
      chineseName: '登入 API',
      method: 'POST',
      url: '/login',
      healthCheck: {
        enabled: true,
        data: {
          account: 'DEMO0001',
          password: 'DemoPass123!'
        }
      }
    },
    register: {
      chineseName: '註冊 API',
      method: 'POST',
      url: '/register',
      healthCheck: {
        enabled: false,
        reason: '避免新增測試資料'
      }
    },
    fetchUser: {
      chineseName: '使用者資料查詢 API',
      method: 'GET',
      url: ({ account }) => `/users/${encodeURIComponent(account ?? '')}`,
      healthCheck: {
        enabled: true,
        params: {
          account: 'DEMO0001'
        }
      }
    },
    fetchExchangeRates: {
      chineseName: '匯率查詢 API',
      method: 'GET',
      url: '/exchange-rates',
      healthCheck: {
        enabled: true
      }
    },
    updateLoans: {
      chineseName: '發票放款資訊更新 API',
      method: 'PUT',
      url: ({ account }) => `/users/${encodeURIComponent(account ?? '')}/loans`,
      healthCheck: {
        enabled: false,
        params: {
          account: 'DEMO0001'
        },
        reason: '避免更新放款資料'
      }
    },
    fetchLoanChangeLogs: {
      chineseName: '放款異動紀錄查詢 API',
      method: 'GET',
      url: ({ account }) => `/users/${encodeURIComponent(account ?? '')}/loan-change-logs`,
      healthCheck: {
        enabled: true,
        params: {
          account: 'DEMO0001'
        }
      }
    }
  } satisfies Record<string, BackendApiEndpoint>
};

// 依 API 名稱與參數解析實際 URL 與 HTTP method，讓 service 層不需要知道路徑組裝細節。
export function resolveBackendApiEndpoint(
  endpointName: string,
  params: EndpointParams = {}
): ResolvedBackendApiEndpoint {
  const endpoint = (backendApiConfig.endpoints as Record<string, BackendApiEndpoint>)[endpointName];

  if (!endpoint) {
    throw new Error(`API endpoint not found: ${endpointName}`);
  }

  return {
    method: endpoint.method.toLowerCase() as ResolvedBackendApiEndpoint['method'],
    methodLabel: endpoint.method,
    chineseName: endpoint.chineseName,
    url: typeof endpoint.url === 'function' ? endpoint.url(params) : endpoint.url
  };
}

export function buildFullApiUrl(path: string) {
  const baseURL = backendApiConfig.baseURL.replace(/\/+$/, '');
  const normalizedPath = String(path).startsWith('/') ? path : `/${path}`;

  return `${baseURL}${normalizedPath}`;
}
import type { BackendApiEndpoint, EndpointParams, ResolvedBackendApiEndpoint } from '../types/api';
