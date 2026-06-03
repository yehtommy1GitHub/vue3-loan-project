import axios, { type AxiosInstance } from 'axios';
import { backendApiConfig } from '../config/backendApiConfig';

// API Client 層：建立共用 HTTP client，統一 baseURL、header 與 timeout。
export function createApiClient(): AxiosInstance {
  return axios.create({
    baseURL: backendApiConfig.baseURL,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    timeout: backendApiConfig.timeout
  });
}

// 專案內預設共用 client；其他專案若要重用，可直接改用 createApiClient 建立自己的實例。
export const apiClient: AxiosInstance = createApiClient();
