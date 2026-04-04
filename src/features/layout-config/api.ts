import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPut } from '@/shared/api/http';
import type { LayoutConfigResponse } from '@/shared/types/contracts';

const layoutQueryKey = ['config', 'layout'] as const;

export function useLayoutConfigQuery() {
  return useQuery({
    queryKey: layoutQueryKey,
    queryFn: () => apiGet<LayoutConfigResponse>('/v1/config/layout/collectors')
  });
}

export function useSaveLayoutMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: LayoutConfigResponse) =>
      apiPut<LayoutConfigResponse, LayoutConfigResponse>('/v1/config/layout/collectors', payload),
    onSuccess: (data) => {
      queryClient.setQueryData(layoutQueryKey, data);
    }
  });
}
