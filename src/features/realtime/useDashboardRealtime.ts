import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { env } from '@/shared/config/env';
import { fetchDashboardSnapshot, fetchRealtimeCollectors } from '@/features/realtime/api';
import { useRealtimeStore } from '@/features/realtime/store';
import type { DashboardSnapshot, RealtimeStreamEvent } from '@/shared/types/contracts';

export const dashboardQueryKey = ['dashboard', 'snapshot'] as const;

function parseSSEEvent(value: string): RealtimeStreamEvent | null {
  try {
    return JSON.parse(value) as RealtimeStreamEvent;
  } catch {
    return null;
  }
}

export function useDashboardData() {
  const setLastUpdatedAt = useRealtimeStore((state) => state.setLastUpdatedAt);
  return useQuery({
    queryKey: dashboardQueryKey,
    queryFn: async () => {
      const snapshot = await fetchDashboardSnapshot();
      setLastUpdatedAt(snapshot.updatedAt);
      return snapshot;
    }
  });
}

export function useDashboardRealtimeBridge(enabled: boolean): void {
  const queryClient = useQueryClient();
  const retries = useRef(0);
  const reconnectTimer = useRef<number | undefined>(undefined);

  const setConnectionStatus = useRealtimeStore((state) => state.setConnectionStatus);
  const setLastUpdatedAt = useRealtimeStore((state) => state.setLastUpdatedAt);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    let source: EventSource | null = null;
    let pollingTimer: number | null = null;
    let cancelled = false;

    const startPolling = async (): Promise<void> => {
      setConnectionStatus('fallback-polling');
      if (pollingTimer) {
        window.clearInterval(pollingTimer);
      }
      pollingTimer = window.setInterval(async () => {
        try {
          const [collectors, snapshot] = await Promise.all([
            fetchRealtimeCollectors(),
            fetchDashboardSnapshot()
          ]);
          queryClient.setQueryData<DashboardSnapshot>(dashboardQueryKey, {
            ...snapshot,
            collectors
          });
          setLastUpdatedAt(snapshot.updatedAt);
        } catch {
          // polling keeps trying; error hint handled by query boundaries
        }
      }, env.pollingMs);
    };

    const connectSSE = (): void => {
      if (env.enableMock || env.realtimeMode !== 'sse') {
        void startPolling();
        return;
      }
      if (cancelled) {
        return;
      }
      setConnectionStatus('reconnecting');
      source = new EventSource(`${env.apiBaseUrl}/v1/stream/collectors`);

      source.onopen = async () => {
        retries.current = 0;
        setConnectionStatus('connected');
        const snapshot = await fetchDashboardSnapshot();
        queryClient.setQueryData(dashboardQueryKey, snapshot);
        setLastUpdatedAt(snapshot.updatedAt);
      };

      source.onmessage = async (event) => {
        const parsed = parseSSEEvent(event.data);
        if (!parsed) {
          return;
        }
        if (parsed.type === 'heartbeat') {
          return;
        }
        const snapshot = await fetchDashboardSnapshot();
        queryClient.setQueryData(dashboardQueryKey, snapshot);
        setLastUpdatedAt(snapshot.updatedAt);
      };

      source.onerror = () => {
        source?.close();
        retries.current += 1;
        if (retries.current > env.sseRetryMax) {
          void startPolling();
          return;
        }
        setConnectionStatus('reconnecting');
        const delay = Math.min([1000, 2000, 5000, 10000][retries.current - 1] ?? 10000, 10000);
        reconnectTimer.current = window.setTimeout(connectSSE, delay);
      };
    };

    connectSSE();

    return () => {
      cancelled = true;
      source?.close();
      if (reconnectTimer.current) {
        window.clearTimeout(reconnectTimer.current);
      }
      if (pollingTimer) {
        window.clearInterval(pollingTimer);
      }
    };
  }, [enabled, queryClient, setConnectionStatus, setLastUpdatedAt]);
}
