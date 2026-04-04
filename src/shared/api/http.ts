import axios, { AxiosError } from 'axios';
import { env } from '@/shared/config/env';
import { mockAdapter } from '@/shared/api/mockServer';
import type { ApiFailure, ApiResponse } from '@/shared/types/api';

export const http = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 10000
});

if (env.enableMock) {
  http.defaults.adapter = mockAdapter;
}

function asFailure(input: unknown): ApiFailure | undefined {
  if (!input || typeof input !== 'object') {
    return undefined;
  }
  const obj = input as Partial<ApiFailure>;
  if (obj.success === false && typeof obj.code === 'string') {
    return { success: false, code: obj.code, message: obj.message };
  }
  return undefined;
}

http.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    const dataFailure = asFailure(error.response?.data);
    const normalized = new Error(dataFailure?.message ?? error.message) as Error & { code: string };
    normalized.code = dataFailure?.code ?? 'UNKNOWN_ERROR';
    return Promise.reject(normalized);
  }
);

export async function apiGet<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const response = await http.get<ApiResponse<T>>(url, { params });
  return unwrapApiResponse(response.data);
}

export async function apiPost<T, B = unknown>(url: string, body?: B): Promise<T> {
  const response = await http.post<ApiResponse<T>>(url, body);
  return unwrapApiResponse(response.data);
}

export async function apiPut<T, B = unknown>(url: string, body?: B): Promise<T> {
  const response = await http.put<ApiResponse<T>>(url, body);
  return unwrapApiResponse(response.data);
}

export function unwrapApiResponse<T>(response: ApiResponse<T>): T {
  if (response.success) {
    return response.data;
  }
  const error = new Error(response.message ?? response.code) as Error & { code: string };
  error.code = response.code;
  throw error;
}
