import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { normalizeApiError } from './errors';
import type {
  ApiEndpoint,
  ApiRequestOptions,
  ApiSdk,
  ApiSdkConfig,
  EndpointParams,
  ResolvedApiEndpoint
} from './types';

const defaultHeaders: Record<string, string> = {
  'Content-Type': 'application/json',
  Accept: 'application/json'
};

// 建立可重用 API SDK；使用端可注入 Axios instance，方便攔截器、測試與既有專案整合。
export function createApiSdk<TEndpointName extends string, TParams extends EndpointParams = EndpointParams>(
  config: ApiSdkConfig<TEndpointName, TParams>
): ApiSdk<TEndpointName, TParams> {
  const client: AxiosInstance = config.client ?? axios.create({
    baseURL: config.baseURL,
    timeout: config.timeout ?? 8000,
    headers: {
      ...defaultHeaders,
      ...config.headers
    }
  });

  function resolveEndpoint(endpointName: TEndpointName, params = {} as TParams): ResolvedApiEndpoint {
    const endpoint: ApiEndpoint<TParams> | undefined = config.endpoints[endpointName];

    if (!endpoint) {
      throw new Error(`API endpoint not found: ${endpointName}`);
    }

    return {
      method: endpoint.method,
      path: typeof endpoint.path === 'function' ? endpoint.path(params) : endpoint.path
    };
  }

  async function request<TResponse, TData = unknown>(
    endpointName: TEndpointName,
    options: ApiRequestOptions<TData, TParams> = {}
  ): Promise<TResponse> {
    const endpoint = resolveEndpoint(endpointName, options.params);
    const requestConfig: AxiosRequestConfig<TData> = {
      ...options.config,
      method: endpoint.method,
      url: endpoint.path,
      data: options.data
    };

    try {
      const response = await client.request<TResponse>(requestConfig);
      return response.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  }

  return {
    client,
    resolveEndpoint,
    request
  };
}
