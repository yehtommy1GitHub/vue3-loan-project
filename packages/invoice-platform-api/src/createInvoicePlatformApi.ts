import { assertApiSuccess, createApiSdk } from '@vue3-invoice/api-sdk';
import type { ApiEndpoint } from '@vue3-invoice/api-sdk';
import { defaultInvoiceEndpoints } from './endpoints';
import { normalizeChangeLog, normalizeUser } from './normalizers';
import type {
  ExchangeRatesResponse,
  InvoiceApiResponse,
  InvoiceEndpointName,
  InvoiceEndpointParams,
  InvoicePlatformApi,
  InvoicePlatformApiOptions,
  InvoiceRawRequestOptions,
  InvoiceResolvedEndpoint,
  Loan,
  LoanChangeLog,
  UserProfile
} from './types';

// 建立發票平台業務 API；使用端只需提供 baseURL，即可呼叫登入、使用者、放款與匯率 API。
export function createInvoicePlatformApi(options: InvoicePlatformApiOptions): InvoicePlatformApi {
  const endpoints = {
    ...defaultInvoiceEndpoints,
    ...options.endpoints
  } as Record<InvoiceEndpointName, ApiEndpoint<InvoiceEndpointParams>>;

  const sdk = createApiSdk<InvoiceEndpointName, InvoiceEndpointParams>({
    baseURL: options.baseURL,
    timeout: options.timeout,
    headers: options.headers,
    client: options.client,
    endpoints
  });

  async function login(account: string, password: string): Promise<UserProfile> {
    const data = assertApiSuccess(await sdk.request<InvoiceApiResponse, { account: string; password: string }>('login', {
      data: { account, password }
    }));

    return normalizeUser(data, account);
  }

  async function register(account: string, password: string, userName: string): Promise<UserProfile> {
    const data = assertApiSuccess(
      await sdk.request<InvoiceApiResponse, { account: string; password: string; userName: string }>('register', {
        data: { account, password, userName }
      })
    );

    return normalizeUser(data, account);
  }

  async function fetchUser(account: string): Promise<UserProfile> {
    const data = assertApiSuccess(
      await sdk.request<InvoiceApiResponse>('fetchUser', {
        params: { account }
      })
    );

    return normalizeUser(data, account);
  }

  async function updateLoans(account: string, loans: Loan[]): Promise<UserProfile> {
    const data = assertApiSuccess(
      await sdk.request<InvoiceApiResponse, { loans: Loan[] }>('updateLoans', {
        params: { account },
        data: { loans }
      })
    );

    return normalizeUser(data, account);
  }

  async function fetchLoanChangeLogs(account: string): Promise<LoanChangeLog[]> {
    const data = assertApiSuccess(
      await sdk.request<InvoiceApiResponse>('fetchLoanChangeLogs', {
        params: { account }
      })
    );

    return Array.isArray(data.loanChangeLogs)
      ? data.loanChangeLogs.map((log: Partial<LoanChangeLog>): LoanChangeLog => normalizeChangeLog(log))
      : [];
  }

  async function fetchExchangeRates(): Promise<ExchangeRatesResponse> {
    const data = assertApiSuccess(await sdk.request<InvoiceApiResponse>('fetchExchangeRates'));

    return {
      baseCurrency: data.baseCurrency ?? 'TWD',
      updatedAt: data.updatedAt ?? '',
      rates: data.rates ?? {}
    };
  }

  function resolveEndpoint(
    endpointName: InvoiceEndpointName,
    params: InvoiceEndpointParams = {}
  ): InvoiceResolvedEndpoint {
    return sdk.resolveEndpoint(endpointName, params);
  }

  async function requestRaw<TResponse, TData = unknown>(
    endpointName: InvoiceEndpointName,
    requestOptions: InvoiceRawRequestOptions<TData> = {}
  ): Promise<TResponse> {
    return sdk.request<TResponse, TData>(endpointName, requestOptions);
  }

  return {
    login,
    register,
    fetchUser,
    updateLoans,
    fetchLoanChangeLogs,
    fetchExchangeRates,
    resolveEndpoint,
    requestRaw
  };
}
