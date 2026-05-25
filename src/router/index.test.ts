import { describe, expect, it } from 'vitest';
import router from './index';

describe('router', () => {
  it('當前匯率資訊頁可在新視窗直接開啟，不需依賴原視窗 Vuex session', () => {
    const exchangeRateRoute = router.getRoutes().find((route) => route.name === 'exchangeRates');

    expect(exchangeRateRoute).toBeTruthy();
    expect(exchangeRateRoute?.meta.requiresAuth).toBeUndefined();
  });

  it('後台 API 狀態檢查頁可直接透過 URL 開啟', () => {
    const adminApiHealthRoute = router.getRoutes().find((route) => route.name === 'adminApiHealth');

    expect(adminApiHealthRoute).toBeTruthy();
    expect(adminApiHealthRoute?.path).toBe('/admin/api-health');
    expect(adminApiHealthRoute?.meta.requiresAuth).toBeUndefined();
  });
});
