import { isAxiosError } from 'axios';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly retryAfterSeconds: number | null;

  constructor(status: number, code: string, message: string, retryAfterSeconds: number | null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

/** Any error from an API call, as an ApiError with the backend's code and message. */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }
  if (isAxiosError(error)) {
    if (!error.response) {
      return new ApiError(
        0,
        'network_error',
        "Can't reach the server. Check your connection.",
        null,
      );
    }
    const body = error.response.data as { error?: { code?: string; message?: string } } | undefined;
    const retryAfter = Number(error.response.headers['retry-after']);
    return new ApiError(
      error.response.status,
      body?.error?.code ?? 'unknown_error',
      body?.error?.message ?? 'Something went wrong. Try again.',
      Number.isFinite(retryAfter) ? retryAfter : null,
    );
  }
  return new ApiError(0, 'unknown_error', 'Something went wrong. Try again.', null);
}
