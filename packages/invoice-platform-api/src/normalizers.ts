import type { InvoiceApiResponse, Loan, LoanChangeLog, UserProfile } from './types';

export function normalizeLoan(item: Partial<Loan>): Loan {
  return {
    loanAccount: item.loanAccount ?? '',
    currency: item.currency ?? '',
    currentOutstandingAmount: item.currentOutstandingAmount ?? '',
    nextPaymentDate: item.nextPaymentDate ?? '',
    nextPaymentAmount: item.nextPaymentAmount ?? ''
  };
}

export function normalizeChangeLog(item: Partial<LoanChangeLog>): LoanChangeLog {
  return {
    changedAt: item.changedAt ?? '',
    changedBy: item.changedBy ?? '',
    changeItem: item.changeItem ?? '',
    changeData: Array.isArray(item.changeData) ? item.changeData : [],
    changeContent: item.changeContent ?? ''
  };
}

// 發票平台各業務 API 共用相同使用者正規化規則，避免使用端重複補預設值。
export function normalizeUser(data: InvoiceApiResponse, fallbackAccount: string): UserProfile {
  const user = data.user ?? data;
  const loans = user.loans ?? [];
  const loanChangeLogs = user.loanChangeLogs ?? [];

  return {
    account: user.account ?? fallbackAccount,
    userName: user.userName ?? '未知使用者',
    loans: Array.isArray(loans) ? loans.map((loan: Partial<Loan>): Loan => normalizeLoan(loan)) : [],
    loanChangeLogs: Array.isArray(loanChangeLogs)
      ? loanChangeLogs.map((log: Partial<LoanChangeLog>): LoanChangeLog => normalizeChangeLog(log))
      : []
  };
}
