import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import { describe, expect, it, vi } from 'vitest';
import { createInvoicePlatformApi } from './index';

function createClientMock(): { client: AxiosInstance; request: ReturnType<typeof vi.fn> } {
  const request = vi.fn();
  return {
    client: { request } as unknown as AxiosInstance,
    request
  };
}

describe('@vue3-invoice/platform-api', () => {
  it('登入時送出正確 payload 並正規化使用者資料', async () => {
    const { client, request } = createClientMock();
    request.mockResolvedValue({
      data: {
        success: true,
        user: {
          account: 'DEMO0001',
          userName: '安全範例使用者'
        }
      }
    });
    const api = createInvoicePlatformApi({ baseURL: 'https://api.example.test', client });

    const user = await api.login('DEMO0001', 'DemoPass123!');

    expect(request).toHaveBeenCalledWith({
      method: 'POST',
      url: '/login',
      data: {
        account: 'DEMO0001',
        password: 'DemoPass123!'
      }
    });
    expect(user).toEqual({
      account: 'DEMO0001',
      userName: '安全範例使用者',
      loans: [],
      loanChangeLogs: []
    });
  });

  it('更新發票放款資訊時組出動態路徑與 payload', async () => {
    const { client, request } = createClientMock();
    request.mockResolvedValue({
      data: {
        success: true,
        user: {
          account: 'DEMO0001',
          userName: '安全範例使用者',
          loans: []
        }
      }
    });
    const api = createInvoicePlatformApi({ baseURL: 'https://api.example.test', client });
    const loans = [
      {
        loanAccount: '9000000000001',
        currency: 'TWD',
        currentOutstandingAmount: 1000,
        nextPaymentDate: '20260701',
        nextPaymentAmount: 100
      }
    ];

    await api.updateLoans('DEMO/001', loans);

    expect(request).toHaveBeenCalledWith({
      method: 'PUT',
      url: '/users/DEMO%2F001/loans',
      data: { loans }
    });
  });

  it('匯率欄位缺漏時提供穩定預設值', async () => {
    const { client, request } = createClientMock();
    request.mockResolvedValue({ data: { success: true } });
    const api = createInvoicePlatformApi({ baseURL: 'https://api.example.test', client });

    await expect(api.fetchExchangeRates()).resolves.toEqual({
      baseCurrency: 'TWD',
      updatedAt: '',
      rates: {}
    });
  });

  it('可覆寫端點並使用 requestRaw 呼叫額外電文', async () => {
    const { client, request } = createClientMock();
    request.mockResolvedValue({ data: { success: true, value: 1 } });
    const api = createInvoicePlatformApi({
      baseURL: 'https://api.example.test',
      client,
      endpoints: {
        fetchUser: {
          method: 'GET',
          path: '/custom-user'
        }
      }
    });

    await api.requestRaw<{ success: boolean; value: number }>('fetchUser', {
      config: { headers: { 'X-Test': 'true' } } as AxiosRequestConfig
    });

    expect(request).toHaveBeenCalledWith({
      headers: { 'X-Test': 'true' },
      method: 'GET',
      url: '/custom-user',
      data: undefined
    });
  });

  it('success=false 時回傳統一業務錯誤', async () => {
    const { client, request } = createClientMock();
    request.mockResolvedValue({ data: { success: false, message: '帳密錯誤' } });
    const api = createInvoicePlatformApi({ baseURL: 'https://api.example.test', client });

    await expect(api.login('DEMO0001', 'WrongPass123!')).rejects.toMatchObject({
      name: 'ApiSdkError',
      message: '帳密錯誤'
    });
  });
});
