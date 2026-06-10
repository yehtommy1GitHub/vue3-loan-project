import type { AxiosInstance } from 'axios';
import { describe, expect, it, vi } from 'vitest';
import { assertApiSuccess, ApiSdkError, createApiSdk } from './index';

type TestEndpointName = 'fetchUser' | 'saveUser';
type TestEndpointParams = Record<string, string | number | boolean | null | undefined> & { account?: string };

function createClientMock(): { client: AxiosInstance; request: ReturnType<typeof vi.fn> } {
  const request = vi.fn();
  return {
    client: { request } as unknown as AxiosInstance,
    request
  };
}

function createTestSdk(client: AxiosInstance): ReturnType<typeof createApiSdk<TestEndpointName, TestEndpointParams>> {
  return createApiSdk<TestEndpointName, TestEndpointParams>({
    baseURL: 'https://api.example.test',
    client,
    endpoints: {
      fetchUser: {
        method: 'GET',
        path: ({ account }: TestEndpointParams): string => `/users/${encodeURIComponent(account ?? '')}`
      },
      saveUser: {
        method: 'PUT',
        path: '/users'
      }
    }
  });
}

describe('@vue3-invoice/api-sdk', () => {
  it('可解析動態端點路徑', () => {
    const { client } = createClientMock();
    const sdk = createTestSdk(client);

    expect(sdk.resolveEndpoint('fetchUser', { account: 'DEMO 001' })).toEqual({
      method: 'GET',
      path: '/users/DEMO%20001'
    });
  });

  it('透過注入的 HTTP client 發送請求並回傳 response data', async () => {
    const { client, request } = createClientMock();
    request.mockResolvedValue({ data: { success: true, name: '安全範例使用者' } });
    const sdk = createTestSdk(client);

    const result = await sdk.request<{ success: boolean; name: string }, { name: string }>('saveUser', {
      data: { name: '安全範例使用者' }
    });

    expect(request).toHaveBeenCalledWith({
      method: 'PUT',
      url: '/users',
      data: { name: '安全範例使用者' }
    });
    expect(result.name).toBe('安全範例使用者');
  });

  it('將 HTTP 錯誤統一轉成 ApiSdkError', async () => {
    const { client, request } = createClientMock();
    request.mockRejectedValue({
      message: 'Request failed',
      code: 'ERR_BAD_REQUEST',
      response: {
        status: 400,
        data: { message: '資料格式錯誤' }
      }
    });
    const sdk = createTestSdk(client);

    await expect(sdk.request('fetchUser', { params: { account: 'DEMO0001' } })).rejects.toMatchObject({
      name: 'ApiSdkError',
      message: '資料格式錯誤',
      status: 400,
      code: 'ERR_BAD_REQUEST'
    });
  });

  it('可統一檢查 success=false 的業務錯誤', () => {
    expect(() => assertApiSuccess({ success: false, message: '帳密錯誤' })).toThrow(ApiSdkError);
    expect(assertApiSuccess({ success: true, value: 1 })).toEqual({ success: true, value: 1 });
  });
});
