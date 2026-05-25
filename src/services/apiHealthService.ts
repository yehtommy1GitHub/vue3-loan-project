// 匯入 Axios，後台健康檢查使用同一套 HTTP client 形式呼叫 API。
import axios, { AxiosError } from 'axios';
// 匯入 API 參數檔，健康檢查頁需依目前 mock/backend 模式產生完整 URL。
import { backendApiConfig, buildFullApiUrl, resolveBackendApiEndpoint } from '../config/backendApiConfig';
import type { ApiHealthCheck, ApiHealthRow, ApiHealthRuntimeInfo, AxiosMethod } from '../types/api';

const healthClient = axios.create({
  baseURL: backendApiConfig.baseURL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  },
  timeout: backendApiConfig.timeout
});

function formatStatus(error: unknown) {
  const axiosError = error as AxiosError;

  if (axiosError.response?.status) {
    return `異常（HTTP ${axiosError.response.status}）`;
  }

  return `異常（${axiosError.message || '連線失敗'}）`;
}

function formatDetail(error: unknown) {
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

function buildHealthTarget(endpointName: string) {
  const endpoint = backendApiConfig.endpoints[endpointName as keyof typeof backendApiConfig.endpoints];
  const healthCheck = (endpoint.healthCheck ?? { enabled: false, reason: '未設定檢查方式' }) as ApiHealthCheck;
  const params = healthCheck.params ?? {};
  const resolvedEndpoint = resolveBackendApiEndpoint(endpointName, params);

  return {
    endpointName,
    chineseName: resolvedEndpoint.chineseName,
    method: resolvedEndpoint.method,
    methodLabel: resolvedEndpoint.methodLabel,
    url: resolvedEndpoint.url,
    fullUrl: buildFullApiUrl(resolvedEndpoint.url),
    healthCheck
  };
}

export function buildApiHealthRows(): ApiHealthRow[] {
  return Object.keys(backendApiConfig.endpoints).map((endpointName) => {
    const target = buildHealthTarget(endpointName);

    return {
      endpointName: target.endpointName,
      fullUrl: target.fullUrl,
      chineseName: target.chineseName,
      currentStatus: target.healthCheck.enabled ? '待檢查' : `未檢查（${target.healthCheck.reason ?? '未設定檢查方式'}）`,
      detail: target.healthCheck.enabled ? '' : target.healthCheck.reason ?? '未設定檢查方式'
    };
  });
}

export function getApiHealthRuntimeInfo(): ApiHealthRuntimeInfo {
  return {
    mode: backendApiConfig.mode,
    baseURL: backendApiConfig.baseURL,
    timeout: backendApiConfig.timeout,
    configError: backendApiConfig.configError,
    checkedAt: new Date().toLocaleString('zh-TW', { hour12: false })
  };
}

// 逐一檢查 API；會異動資料的端點在 config 內 disabled，頁面只列出不送出。
export async function checkApiHealth(): Promise<ApiHealthRow[]> {
  if (backendApiConfig.configError) {
    return buildApiHealthRows().map((row) => ({
      ...row,
      currentStatus: `異常（${backendApiConfig.configError}）`,
      detail: backendApiConfig.configError
    }));
  }

  const targets = Object.keys(backendApiConfig.endpoints).map(buildHealthTarget);

  return Promise.all(
    targets.map(async (target) => {
      if (!target.healthCheck.enabled) {
        return {
          endpointName: target.endpointName,
          fullUrl: target.fullUrl,
          chineseName: target.chineseName,
          currentStatus: `未檢查（${target.healthCheck.reason ?? '未設定檢查方式'}）`,
          detail: target.healthCheck.reason ?? '未設定檢查方式'
        };
      }

      try {
        if (['post', 'put', 'patch'].includes(target.method)) {
          await healthClient[target.method](target.url, target.healthCheck.data ?? {});
        } else {
          await healthClient[target.method as Exclude<AxiosMethod, 'post' | 'put' | 'patch'>](target.url);
        }

        return {
          endpointName: target.endpointName,
          fullUrl: target.fullUrl,
          chineseName: target.chineseName,
          currentStatus: '正常',
          detail: ''
        };
      } catch (error) {
        return {
          endpointName: target.endpointName,
          fullUrl: target.fullUrl,
          chineseName: target.chineseName,
          currentStatus: formatStatus(error),
          detail: formatDetail(error)
        };
      }
    })
  );
}
