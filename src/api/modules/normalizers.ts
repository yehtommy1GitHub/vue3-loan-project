import type { ApiResponsePayload } from '../../types/api';
import type { Loan, LoanChangeLog, UserProfile } from '../../types/loan';

// 業務 API 層：正規化放款資料，避免後端欄位缺漏時造成畫面錯誤。
export function normalizeLoan(item: Partial<Loan>): Loan {
  return {
    loanAccount: item.loanAccount ?? '',
    currency: item.currency ?? '',
    currentOutstandingAmount: item.currentOutstandingAmount ?? '',
    nextPaymentDate: item.nextPaymentDate ?? '',
    nextPaymentAmount: item.nextPaymentAmount ?? ''
  };
}

// 業務 API 層：正規化發票放款資訊異動紀錄，支援新版 changeData 與舊版 changeContent。
export function normalizeChangeLog(item: Partial<LoanChangeLog>): LoanChangeLog {
  return {
    changedAt: item.changedAt ?? '',
    changedBy: item.changedBy ?? '',
    changeItem: item.changeItem ?? '',
    changeData: Array.isArray(item.changeData) ? item.changeData : [],
    changeContent: item.changeContent ?? ''
  };
}

// 業務 API 層：正規化使用者資料，登入、註冊與更新發票放款資訊都會共用此處理。
export function normalizeUser(data: ApiResponsePayload, fallbackAccount: string): UserProfile {
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
