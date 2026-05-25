// API 端點設定型別集中管理，確保 config、service 與後台健康檢查使用一致的 method 與路徑格式。
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
