// API 端點設定型別集中管理，確保 config、service 與後台健康檢查使用一致的 method 與路徑格式。
import type { ExchangeRatesResponse, Loan, LoanChangeLog, UserProfile } from './loan';

export type ApiMethodLabel = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type AxiosMethod = Lowercase<ApiMethodLabel>;

export interface EndpointParams {
  account?: string;
}

export interface ApiHealthCheck {
  enabled: boolean;
  reason?: string;
  params?: EndpointParams;
  data?: Record<string, unknown>;
}

export interface BackendApiEndpoint {
  chineseName: string;
  method: ApiMethodLabel;
  url: string | ((params: EndpointParams) => string);
  healthCheck?: ApiHealthCheck;
}

export interface ResolvedBackendApiEndpoint {
  method: AxiosMethod;
  methodLabel: ApiMethodLabel;
  chineseName: string;
  url: string;
}

export interface ApiResponsePayload {
  success?: boolean;
  message?: string;
  user?: Partial<UserProfile>;
  account?: string;
  userName?: string;
  loans?: Loan[];
  loanChangeLogs?: LoanChangeLog[];
  baseCurrency?: ExchangeRatesResponse['baseCurrency'];
  updatedAt?: ExchangeRatesResponse['updatedAt'];
  rates?: ExchangeRatesResponse['rates'];
}

export interface RequestEndpointOptions {
  params?: EndpointParams;
  data?: unknown;
}

export interface ApiHealthTarget {
  endpointName: string;
  chineseName: string;
  method: AxiosMethod;
  methodLabel: ApiMethodLabel;
  url: string;
  fullUrl: string;
  healthCheck: ApiHealthCheck;
}

export interface ApiHealthRow {
  endpointName: string;
  fullUrl: string;
  chineseName: string;
  currentStatus: string;
  detail: string;
}

export interface ApiHealthRuntimeInfo {
  mode: string;
  baseURL: string;
  timeout: number;
  configError: string;
  checkedAt: string;
}
