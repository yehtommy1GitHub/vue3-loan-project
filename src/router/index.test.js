import { describe, expect, it } from 'vitest';
import router from './index';

describe('router', () => {
  it('當前匯率資訊頁可在新視窗直接開啟，不需依賴原視窗 Vuex session', () => {
    const exchangeRateRoute = router.getRoutes().find((route) => route.name === 'exchangeRates');

    expect(exchangeRateRoute).toBeTruthy();
    expect(exchangeRateRoute.meta.requiresAuth).toBeUndefined();
  });
});
