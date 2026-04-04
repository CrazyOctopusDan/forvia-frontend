import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPut } from '@/shared/api/http';
import type { ThresholdConfig, ThresholdSyncResult } from '@/shared/types/contracts';

const thresholdsQueryKey = ['config', 'thresholds'] as const;

export interface ThresholdSyncRequest {
  sourceCollectorId: string;
  targetCollectorIds: string[];
}

export function useThresholdsQuery() {
  return useQuery({
    queryKey: thresholdsQueryKey,
    queryFn: () => apiGet<ThresholdConfig[]>('/v1/config/thresholds')
  });
}

export function useSaveThresholdMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ collectorId, payload }: { collectorId: string; payload: Omit<ThresholdConfig, 'collectorId' | 'updatedAt'> }) =>
      apiPut<ThresholdConfig, Omit<ThresholdConfig, 'collectorId' | 'updatedAt'>>(`/v1/config/thresholds/${collectorId}`, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: thresholdsQueryKey });
    }
  });
}

export function useSyncThresholdMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ThresholdSyncRequest) =>
      apiPost<ThresholdSyncResult[], ThresholdSyncRequest>('/v1/config/thresholds/sync', payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: thresholdsQueryKey });
    }
  });
}
