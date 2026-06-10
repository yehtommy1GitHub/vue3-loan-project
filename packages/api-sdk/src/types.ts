import type { AxiosInstance, AxiosRequestConfig } from 'axios';

export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type EndpointParams = Record<string, string | number | boolean | null | undefined>;

export interface ApiEndpoint<TParams extends EndpointParams = EndpointParams> {
  method: ApiMethod;
  path: string | ((params: TParams) => string);
}

export interface ResolvedApiEndpoint {
  method: ApiMethod;
  path: string;
}

export interface ApiSdkConfig<TEndpointName extends string, TParams extends EndpointParams = EndpointParams> {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
  endpoints: Record<TEndpointName, ApiEndpoint<TParams>>;
  client?: AxiosInstance;
}

export interface ApiRequestOptions<TData = unknown, TParams extends EndpointParams = EndpointParams> {
  params?: TParams;
  data?: TData;
  config?: AxiosRequestConfig;
}

export interface ApiSdk<TEndpointName extends string, TParams extends EndpointParams = EndpointParams> {
  client: AxiosInstance;
  resolveEndpoint: (endpointName: TEndpointName, params?: TParams) => ResolvedApiEndpoint;
  request: <TResponse, TData = unknown>(
    endpointName: TEndpointName,
    options?: ApiRequestOptions<TData, TParams>
  ) => Promise<TResponse>;
}

export interface ApiSuccessPayload {
  success?: boolean;
  message?: string;
}
