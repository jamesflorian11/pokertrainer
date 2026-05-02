import { API_BASE_URL } from '@/services/api/config';
import { useAppStore } from '@/store/useAppStore';

export type RequestOptions = RequestInit & {
  /** Skip Authorization header for this call */
  skipAuth?: boolean;
};

function getAuthToken(): string | null {
  return useAppStore.getState().authToken;
}

export async function apiGet<T = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { skipAuth, ...init } = options;
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const headers: HeadersInit = {
    Accept: 'application/json',
    ...((init.headers as Record<string, string>) || {}),
  };
  if (!skipAuth) {
    const token = getAuthToken();
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }
  }
  const res = await fetch(url, { ...init, method: 'GET', headers });
  if (!res.ok) {
    throw new Error(`GET ${path} failed: ${res.status}`);
  }
  return (await res.json()) as T;
}
