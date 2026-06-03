import { assertSuccess, requestEndpoint } from '../client/request';
import { normalizeChangeLog, normalizeUser } from './normalizers';
import type { ApiResponsePayload } from '../../types/api';
import type { Loan, LoanChangeLog, UserProfile } from '../../types/loan';

// 業務 API 層：呼叫發票放款資訊更新 API，並回傳已正規化的使用者資料。
export async function updateLoans(account: string, loans: Loan[]): Promise<UserProfile> {
  const data = await requestEndpoint<ApiResponsePayload>('updateLoans', { params: { account }, data: { loans } });
  assertSuccess(data);

  return normalizeUser(data, account);
}

// 業務 API 層：呼叫發票放款資訊異動紀錄查詢 API。
export async function fetchLoanChangeLogs(account: string): Promise<LoanChangeLog[]> {
  const data = await requestEndpoint<ApiResponsePayload>('fetchLoanChangeLogs', { params: { account } });
  assertSuccess(data);

  return Array.isArray(data.loanChangeLogs)
    ? data.loanChangeLogs.map((log: Partial<LoanChangeLog>): LoanChangeLog => normalizeChangeLog(log))
    : [];
}
