// 前端放款資料型別集中放在此處，讓頁面、元件、service 與測試共享同一份資料結構。
export type AmountValue = number | string;

export interface Loan {
  loanAccount: string;
  currency: string;
  currentOutstandingAmount: AmountValue;
  nextPaymentDate: string;
  nextPaymentAmount: AmountValue;
}

export interface EditableLoan extends Loan {
  isPersisted: boolean;
}

export type LoanField = 'loanAccount' | 'currency' | 'nextPaymentDate';
export type LoanNumericField = 'currentOutstandingAmount' | 'nextPaymentAmount';

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

export interface LoanTotals {
  currentOutstandingAmount: number;
  nextPaymentAmount: number;
}

export interface ExchangeRateRow {
  currency: string;
  baseToCurrency: number;
  currencyToBase: number;
}
