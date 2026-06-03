import { assertSuccess, requestEndpoint } from '../client/request';
import type { ApiResponsePayload } from '../../types/api';
import type { ExchangeRatesResponse } from '../../types/loan';

// 業務 API 層：呼叫匯率 API，提供首頁與放款更新頁做不同幣別加總折算。
export async function fetchExchangeRates(): Promise<ExchangeRatesResponse> {
  const data = await requestEndpoint<ApiResponsePayload>('fetchExchangeRates');
  assertSuccess(data);

  return {
    baseCurrency: data.baseCurrency ?? 'TWD',
    updatedAt: data.updatedAt ?? '',
    rates: data.rates ?? {}
  };
}
