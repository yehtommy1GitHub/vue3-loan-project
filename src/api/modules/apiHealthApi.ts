import { backendApiConfig, buildFullApiUrl, resolveBackendApiEndpoint } from '../config/backendApiConfig';
import type { BackendApiEndpointName } from '../config/backendApiConfig';
import { apiClient } from '../client/httpClient';
import { formatApiErrorDetail, formatApiErrorStatus } from '../client/request';
import type { ApiHealthCheck, ApiHealthRow, ApiHealthRuntimeInfo, ApiHealthTarget } from '../../types/api';

// 業務 API 層：依 API 設定產生後台健康檢查目標。
function buildHealthTarget(endpointName: BackendApiEndpointName): ApiHealthTarget {
  const endpoint = backendApiConfig.endpoints[endpointName];
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

// 業務 API 層：產生健康檢查表格初始列，未送出任何 API。
export function buildApiHealthRows(): ApiHealthRow[] {
  return (Object.keys(backendApiConfig.endpoints) as BackendApiEndpointName[]).map(
    (endpointName: BackendApiEndpointName): ApiHealthRow => {
      const target = buildHealthTarget(endpointName);

      return {
        endpointName: target.endpointName,
        fullUrl: target.fullUrl,
        chineseName: target.chineseName,
        currentStatus: target.healthCheck.enabled ? '待檢查' : `未檢查（${target.healthCheck.reason ?? '未設定檢查方式'}）`,
        detail: target.healthCheck.enabled ? '' : target.healthCheck.reason ?? '未設定檢查方式'
      };
    }
  );
}

// 業務 API 層：回傳目前前端實際讀到的 API 執行環境資訊。
export function getApiHealthRuntimeInfo(): ApiHealthRuntimeInfo {
  return {
    mode: backendApiConfig.mode,
    baseURL: backendApiConfig.baseURL,
    timeout: backendApiConfig.timeout,
    configError: backendApiConfig.configError,
    checkedAt: new Date().toLocaleString('zh-TW', { hour12: false })
  };
}

// 業務 API 層：逐一檢查 API；會異動資料的端點在 config 內 disabled，頁面只列出不送出。
export async function checkApiHealth(): Promise<ApiHealthRow[]> {
  if (backendApiConfig.configError) {
    return buildApiHealthRows().map((row: ApiHealthRow): ApiHealthRow => ({
      ...row,
      currentStatus: `異常（${backendApiConfig.configError}）`,
      detail: backendApiConfig.configError
    }));
  }

  const targets = (Object.keys(backendApiConfig.endpoints) as BackendApiEndpointName[]).map(
    (endpointName: BackendApiEndpointName): ApiHealthTarget => buildHealthTarget(endpointName)
  );

  return Promise.all(
    targets.map(async (target: ApiHealthTarget): Promise<ApiHealthRow> => {
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
        await apiClient.request({
          method: target.methodLabel,
          url: target.url,
          data: target.healthCheck.data
        });

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
          currentStatus: formatApiErrorStatus(error),
          detail: formatApiErrorDetail(error)
        };
      }
    })
  );
}
