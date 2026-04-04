export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiFailure {
  success: false;
  code: string;
  message?: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export interface FrontendError extends Error {
  code: string;
}
