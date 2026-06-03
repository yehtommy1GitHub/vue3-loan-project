import { AxiosError, type AxiosResponse } from 'axios';
import { backendApiConfig, resolveBackendApiEndpoint } from '../config/backendApiConfig';
import type { BackendApiEndpointName } from '../config/backendApiConfig';
import { apiClient } from './httpClient';
import type { ApiResponsePayload, RequestEndpointOptions } from '../../types/api';

// API Client 層：將 Axios error 統一轉成畫面可理解的訊息。
export function getApiErrorMessage(error: unknown): string {
  const axiosError = error as AxiosError<{ message?: string }>;

  return axiosError.response?.data?.message ?? '連線失敗';
}

// API Client 層：提供後台健康檢查可顯示的 HTTP 狀態文字。
export function formatApiErrorStatus(error: unknown): string {
  const axiosError = error as AxiosError;

  if (axiosError.response?.status) {
    return `異常（HTTP ${axiosError.response.status}）`;
  }

  return `異常（${axiosError.message || '連線失敗'}）`;
}

// API Client 層：提供後台健康檢查可顯示的詳細錯誤資訊。
export function formatApiErrorDetail(error: unknown): string {
  const axiosError = error as AxiosError<{ message?: string }>;

  if (axiosError.response?.data?.message) {
    return axiosError.response.data.message;
  }

  if (axiosError.response?.status) {
    return `HTTP ${axiosError.response.status} ${axiosError.response.statusText || ''}`.trim();
  }

  if (axiosError.code) {
    return `${axiosError.code}: ${axiosError.message}`;
  }

  return axiosError.message || '';
}

// API Client 層：包裝 request promise，讓所有 API 共用一致的錯誤轉換規則。
export async function requestJson<TResponse extends ApiResponsePayload>(
  action: () => Promise<AxiosResponse<TResponse>>
): Promise<TResponse> {
  try {
    const response = await action();
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}

// API Client 層：依端點名稱解析 URL/method，再交由 axios request 執行。
export async function requestEndpoint<TResponse extends ApiResponsePayload = ApiResponsePayload>(
  endpointName: BackendApiEndpointName,
  { params = {}, data }: RequestEndpointOptions = {}
): Promise<TResponse> {
  if (backendApiConfig.configError) {
    throw new Error(backendApiConfig.configError);
  }

  const endpoint = resolveBackendApiEndpoint(endpointName, params);

  return requestJson<TResponse>(() =>
    apiClient.request<TResponse>({
      method: endpoint.methodLabel,
      url: endpoint.url,
      data
    })
  );
}

// API Client 層：統一檢查 API success 欄位，避免各業務 API 重複撰寫。
export function assertSuccess(data: ApiResponsePayload, fallbackMessage = '帳密錯誤'): void {
  if (data.success === false) {
    throw new Error(data.message ?? fallbackMessage);
  }
}
