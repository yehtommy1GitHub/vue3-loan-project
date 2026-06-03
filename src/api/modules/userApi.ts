import { assertSuccess, requestEndpoint } from '../client/request';
import { normalizeUser } from './normalizers';
import type { ApiResponsePayload } from '../../types/api';
import type { UserProfile } from '../../types/loan';

// 業務 API 層：查詢使用者資料，首頁 onMounted 會用它同步最新放款與異動紀錄。
export async function fetchUser(account: string): Promise<UserProfile> {
  const data = await requestEndpoint<ApiResponsePayload>('fetchUser', { params: { account } });
  assertSuccess(data);

  return normalizeUser(data, account);
}
