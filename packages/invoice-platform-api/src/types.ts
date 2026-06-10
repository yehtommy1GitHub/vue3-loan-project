import type { AxiosInstance, AxiosRequestConfig } from 'axios';

export type AmountValue = number | string;
export type InvoiceEndpointName =
  | 'login'
  | 'register'
  | 'fetchUser'
  | 'updateLoans'
  | 'fetchLoanChangeLogs'
  | 'fetchExchangeRates';

export interface InvoiceEndpointParams extends Record<string, string | number | boolean | null | undefined> {
  account?: string;
}

export interface InvoiceEndpointDefinition {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string | ((params: InvoiceEndpointParams) => string);
}

export interface Loan {
  loanAccount: string;
  currency: string;
  currentOutstandingAmount: AmountValue;
  nextPaymentDate: string;
  nextPaymentAmount: AmountValue;
}

export interface LoanChangeData {
  loanAccount?: string;
  field?: string;
  fieldName?: string;
  oldValue?: unknown;
  newValue?: unknown;
}

export interface LoanChangeLog {
  changedAt: string;
  changedBy: string;
  changeItem: string;
  changeData: LoanChangeData[];
  changeContent?: string;
}

export interface UserProfile {
  account: string;
  userName: string;
  loans: Loan[];
  loanChangeLogs: LoanChangeLog[];
}

export interface ExchangeRatesResponse {
  baseCurrency: string;
  updatedAt: string;
  rates: Record<string, number>;
}

export interface InvoiceApiResponse {
  success?: boolean;
  message?: string;
  user?: Partial<UserProfile>;
  account?: string;
  userName?: string;
  loans?: Loan[];
  loanChangeLogs?: LoanChangeLog[];
  baseCurrency?: string;
  updatedAt?: string;
  rates?: Record<string, number>;
}

export interface InvoicePlatformApiOptions {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
  client?: AxiosInstance;
  endpoints?: Partial<Record<InvoiceEndpointName, InvoiceEndpointDefinition>>;
}

export interface InvoiceRawRequestOptions<TData = unknown> {
  params?: InvoiceEndpointParams;
  data?: TData;
  config?: AxiosRequestConfig;
}

export interface InvoiceResolvedEndpoint {
  method: InvoiceEndpointDefinition['method'];
  path: string;
}

export interface InvoicePlatformApi {
  login: (account: string, password: string) => Promise<UserProfile>;
  register: (account: string, password: string, userName: string) => Promise<UserProfile>;
  fetchUser: (account: string) => Promise<UserProfile>;
  updateLoans: (account: string, loans: Loan[]) => Promise<UserProfile>;
  fetchLoanChangeLogs: (account: string) => Promise<LoanChangeLog[]>;
  fetchExchangeRates: () => Promise<ExchangeRatesResponse>;
  resolveEndpoint: (endpointName: InvoiceEndpointName, params?: InvoiceEndpointParams) => InvoiceResolvedEndpoint;
  requestRaw: <TResponse, TData = unknown>(
    endpointName: InvoiceEndpointName,
    options?: InvoiceRawRequestOptions<TData>
  ) => Promise<TResponse>;
}
