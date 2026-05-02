import { apiGet } from '@/services/api/client';

export type HealthResponse = { status: string };

export async function getHealth(): Promise<{ ok: boolean; data?: HealthResponse }> {
  const data = await apiGet<HealthResponse>('/health', { skipAuth: true });
  return { ok: data.status === 'ok', data };
}
