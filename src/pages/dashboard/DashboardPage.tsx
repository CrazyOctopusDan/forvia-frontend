import { useMemo } from 'react';
import { useDashboardData, useDashboardRealtimeBridge } from '@/features/realtime/useDashboardRealtime';
import { useRealtimeStore } from '@/features/realtime/store';
import { env } from '@/shared/config/env';
import { isDataStale } from '@/shared/lib/time';
import { getErrorMessage } from '@/shared/types/errors';
import { TopKPI } from '@/pages/dashboard/components/TopKPI';
import { Scene2D5Canvas } from '@/pages/dashboard/components/Scene2D5Canvas';
import { CollectorRollingList } from '@/pages/dashboard/components/CollectorRollingList';

export function DashboardPage() {
  const query = useDashboardData();
  useDashboardRealtimeBridge(true);

  const connectionStatus = useRealtimeStore((state) => state.connectionStatus);
  const lastUpdatedAt = useRealtimeStore((state) => state.lastUpdatedAt);

  const stale = useMemo(() => isDataStale(lastUpdatedAt ?? query.data?.updatedAt, env.pollingMs), [lastUpdatedAt, query.data?.updatedAt]);

  if (query.isLoading || !query.data) {
    return <section className="panel">加载中...</section>;
  }

  if (query.isError) {
    const code = (query.error as { code?: string }).code;
    return <section className="panel error-text">{getErrorMessage(code)}</section>;
  }

  return (
    <section style={{ display: 'grid', gap: 12 }}>
      <h2 className="page-title">大屏总览与实时监控</h2>
      <TopKPI snapshot={query.data} connectionStatus={connectionStatus} dataStale={stale} lastUpdatedAt={lastUpdatedAt} />
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
        <Scene2D5Canvas layout={query.data.layout} collectors={query.data.collectors} />
        <CollectorRollingList collectors={query.data.collectors} />
      </div>
    </section>
  );
}
