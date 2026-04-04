import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/shared/api/http';
import type { AlarmEvent, CollectorHistorySeries, HistoryRange, MetricType } from '@/shared/types/contracts';

const activeAlarmsQueryKey = ['alarms', 'active'] as const;
const historyAlarmsQueryKey = ['alarms', 'history'] as const;

export function useActiveAlarmsQuery() {
  return useQuery({
    queryKey: activeAlarmsQueryKey,
    queryFn: () => apiGet<AlarmEvent[]>('/v1/alarms/active'),
    refetchInterval: 30000
  });
}

export function useHistoryAlarmsQuery(range: HistoryRange) {
  return useQuery({
    queryKey: [...historyAlarmsQueryKey, range],
    queryFn: () => apiGet<AlarmEvent[]>('/v1/alarms/history', { range })
  });
}

export function useAckAlarmMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (alarmId: string) => apiPost<AlarmEvent>(`/v1/alarms/${alarmId}/ack`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: activeAlarmsQueryKey });
      void queryClient.invalidateQueries({ queryKey: historyAlarmsQueryKey });
    }
  });
}

export function useIgnoreAlarmMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (alarmId: string) => apiPost<AlarmEvent>(`/v1/alarms/${alarmId}/ignore`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: activeAlarmsQueryKey });
      void queryClient.invalidateQueries({ queryKey: historyAlarmsQueryKey });
    }
  });
}

export function useCollectorHistoryQuery(collectorId: string, metric: MetricType, range: HistoryRange) {
  return useQuery({
    queryKey: ['collectors', 'history', collectorId, metric, range],
    queryFn: () => apiGet<CollectorHistorySeries>('/v1/collectors/history', { collectorId, metric, range })
  });
}
