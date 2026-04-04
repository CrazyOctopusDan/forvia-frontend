import { apiGet } from '@/shared/api/http';
import type { CollectorRealtime, DashboardSnapshot } from '@/shared/types/contracts';

export async function fetchDashboardSnapshot(): Promise<DashboardSnapshot> {
  return apiGet<DashboardSnapshot>('/v1/dashboard/snapshot');
}

export async function fetchRealtimeCollectors(): Promise<CollectorRealtime[]> {
  return apiGet<CollectorRealtime[]>('/v1/collectors/realtime');
}
