import { afterEach, describe, expect, it, vi } from 'vitest';

async function loadConfig() {
  vi.resetModules();

  return import('./backendApiConfig');
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('backendApiConfig', () => {
  it('預設使用 mock API，並集中提供 baseURL、method 與 URL', async () => {
    vi.stubEnv('VITE_USE_BACKEND_API', 'false');
    vi.stubEnv('VITE_MOCK_API_BASE_URL', 'http://127.0.0.1:3001');
    vi.stubEnv('VITE_BACKEND_API_BASE_URL', '');

    const { backendApiConfig, resolveBackendApiEndpoint } = await loadConfig();

    expect(backendApiConfig.useBackendApi).toBe(false);
    expect(backendApiConfig.mode).toBe('mock');
    expect(backendApiConfig.baseURL).toBe('http://127.0.0.1:3001');
    expect(backendApiConfig.configError).toBe('');
    expect(resolveBackendApiEndpoint('login')).toMatchObject({ method: 'post', methodLabel: 'POST', url: '/login' });
    expect(resolveBackendApiEndpoint('fetchExchangeRates')).toMatchObject({
      method: 'get',
      methodLabel: 'GET',
      url: '/exchange-rates'
    });
  });

  it('TRUE 且填入後端 URL 時會切換到實際後端 API', async () => {
    vi.stubEnv('VITE_USE_BACKEND_API', 'true');
    vi.stubEnv('VITE_BACKEND_API_BASE_URL', 'https://backend.example.test');

    const { backendApiConfig } = await loadConfig();

    expect(backendApiConfig.useBackendApi).toBe(true);
    expect(backendApiConfig.mode).toBe('backend');
    expect(backendApiConfig.baseURL).toBe('https://backend.example.test');
    expect(backendApiConfig.configError).toBe('');
  });

  it('TRUE 但未填後端 URL 時不 fallback mock，改回報設定錯誤', async () => {
    vi.stubEnv('VITE_USE_BACKEND_API', 'true');
    vi.stubEnv('VITE_BACKEND_API_BASE_URL', '');

    const { backendApiConfig } = await loadConfig();

    expect(backendApiConfig.useBackendApi).toBe(true);
    expect(backendApiConfig.mode).toBe('backend');
    expect(backendApiConfig.baseURL).toBe('');
    expect(backendApiConfig.configError).toBe('VITE_BACKEND_API_BASE_URL 未設定，無法連接實際後端 API');
  });

  it('動態 URL 會統一 encode 參數', async () => {
    vi.stubEnv('VITE_USE_BACKEND_API', 'false');

    const { resolveBackendApiEndpoint } = await loadConfig();

    expect(resolveBackendApiEndpoint('fetchUser', { account: 'DEMO 001' })).toMatchObject({
      method: 'get',
      url: '/users/DEMO%20001'
    });
    expect(resolveBackendApiEndpoint('updateLoans', { account: 'DEMO/001' })).toMatchObject({
      method: 'put',
      url: '/users/DEMO%2F001/loans'
    });
  });
});
