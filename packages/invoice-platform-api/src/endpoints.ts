import type { InvoiceEndpointDefinition, InvoiceEndpointName, InvoiceEndpointParams } from './types';

// 發票平台預設端點可由使用端覆寫，方便對接不同後端路徑。
export const defaultInvoiceEndpoints: Record<InvoiceEndpointName, InvoiceEndpointDefinition> = {
  login: {
    method: 'POST',
    path: '/login'
  },
  register: {
    method: 'POST',
    path: '/register'
  },
  fetchUser: {
    method: 'GET',
    path: ({ account }: InvoiceEndpointParams): string => `/users/${encodeURIComponent(account ?? '')}`
  },
  updateLoans: {
    method: 'PUT',
    path: ({ account }: InvoiceEndpointParams): string => `/users/${encodeURIComponent(account ?? '')}/loans`
  },
  fetchLoanChangeLogs: {
    method: 'GET',
    path: ({ account }: InvoiceEndpointParams): string =>
      `/users/${encodeURIComponent(account ?? '')}/loan-change-logs`
  },
  fetchExchangeRates: {
    method: 'GET',
    path: '/exchange-rates'
  }
};
