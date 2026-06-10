import { AxiosError } from 'axios';

export class ApiSdkError extends Error {
  readonly status?: number;
  readonly code?: string;
  readonly details?: unknown;

  constructor(message: string, options: { status?: number; code?: string; details?: unknown; cause?: unknown } = {}) {
    super(message, { cause: options.cause });
    this.name = 'ApiSdkError';
    this.status = options.status;
    this.code = options.code;
    this.details = options.details;
  }
}

// 將 Axios 與一般錯誤統一轉成 ApiSdkError，讓使用端只需要處理一種錯誤格式。
export function normalizeApiError(error: unknown, fallbackMessage = 'API 連線失敗'): ApiSdkError {
  if (error instanceof ApiSdkError) {
    return error;
  }

  const axiosError = error as AxiosError<{ message?: string }>;
  const message = axiosError.response?.data?.message ?? axiosError.message ?? fallbackMessage;

  return new ApiSdkError(message, {
    status: axiosError.response?.status,
    code: axiosError.code,
    details: axiosError.response?.data,
    cause: error
  });
}

export function getApiErrorMessage(error: unknown, fallbackMessage = 'API 連線失敗'): string {
  return normalizeApiError(error, fallbackMessage).message;
}
