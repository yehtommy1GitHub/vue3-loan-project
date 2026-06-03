import { assertSuccess, requestEndpoint } from '../client/request';
import { normalizeUser } from './normalizers';
import type { ApiResponsePayload } from '../../types/api';
import type { UserProfile } from '../../types/loan';

// 業務 API 層：呼叫登入 API，並回傳已正規化的使用者資料。
export async function login(account: string, password: string): Promise<UserProfile> {
  const data = await requestEndpoint<ApiResponsePayload>('login', { data: { account, password } });
  assertSuccess(data);

  return normalizeUser(data, account);
}

// 業務 API 層：呼叫註冊 API，使用者名稱由註冊頁輸入並傳給後端建立 profile。
export async function register(account: string, password: string, userName: string): Promise<UserProfile> {
  const data = await requestEndpoint<ApiResponsePayload>('register', { data: { account, password, userName } });
  assertSuccess(data);

  return normalizeUser(data, account);
}
