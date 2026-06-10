import { ApiSdkError } from './errors';
import type { ApiSuccessPayload } from './types';

// 統一處理後端以 success=false 表示的業務錯誤。
export function assertApiSuccess<TPayload extends ApiSuccessPayload>(
  payload: TPayload,
  fallbackMessage = 'API 執行失敗'
): TPayload {
  if (payload.success === false) {
    throw new ApiSdkError(payload.message ?? fallbackMessage, { details: payload });
  }

  return payload;
}
