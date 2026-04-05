import { useEffect, useMemo, useState } from 'react';
import { useDashboardData, useDashboardRealtimeBridge } from '@/features/realtime/useDashboardRealtime';
import { useRealtimeStore } from '@/features/realtime/store';
import { env } from '@/shared/config/env';
import { isDataStale } from '@/shared/lib/time';
import { getErrorMessage } from '@/shared/types/errors';
import { Scene2D5Canvas } from '@/pages/dashboard/components/Scene2D5Canvas';
import { CollectorRollingList } from '@/pages/dashboard/components/CollectorRollingList';
import type { CollectorRealtime, LayoutNode } from '@/shared/types/contracts';

const fallbackLayout: LayoutNode[] = Array.from({ length: 20 }, (_, i) => ({
  collectorId: `C${String(i + 1).padStart(3, '0')}`,
  x: 80 + (i % 5) * 140,
  y: 90 + Math.floor(i / 5) * 100,
  zIndex: i,
  zone: 'fallback'
}));

const fallbackCollectors: CollectorRealtime[] = fallbackLayout.map((item) => ({
  collectorId: item.collectorId,
  collectorName: item.collectorId,
  temp: 0,
  vib: 0,
  status: 'normal',
  zone: item.zone,
  updatedAt: new Date().toISOString()
}));

export function DashboardPage() {
  const query = useDashboardData();
  useDashboardRealtimeBridge(true);
  const [now, setNow] = useState<Date>(new Date());

  const connectionStatus = useRealtimeStore((state) => state.connectionStatus);
  const lastUpdatedAt = useRealtimeStore((state) => state.lastUpdatedAt);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const stale = useMemo(() => isDataStale(lastUpdatedAt ?? query.data?.updatedAt, env.pollingMs), [lastUpdatedAt, query.data?.updatedAt]);
  const dateText = `${now.toLocaleDateString('zh-CN', { weekday: 'long' })} ${now.toLocaleDateString('zh-CN')}`;
  const timeText = now.toLocaleTimeString('zh-CN', { hour12: false });

  const sceneLayout = query.data?.layout ?? fallbackLayout;
  const sceneCollectors = query.data?.collectors ?? fallbackCollectors;

  const loadMessage = query.isLoading ? '加载中，使用场景骨架预览。' : null;
  const errorMessage = query.isError ? getErrorMessage((query.error as { code?: string }).code) : null;

  return (
    <section className="dashboard-root">
      <header className="dashboard-overlay">
        <div className="dashboard-brand">工厂采集大屏</div>
        <h2 className="dashboard-title">Forvia 智慧工厂采集系统</h2>
        <div className="dashboard-clock">
          <div className="dashboard-time">{timeText}</div>
          <div>{dateText}</div>
        </div>
      </header>

      {loadMessage ? <section className="dashboard-toast panel">{loadMessage}</section> : null}
      {errorMessage ? <section className="dashboard-toast panel error-text">{errorMessage}</section> : null}

      <div className="dashboard-stage">
        <div className="dashboard-scene-layer">
          <Scene2D5Canvas layout={sceneLayout} collectors={sceneCollectors} />
        </div>
        <aside className="dashboard-right-board">
          <CollectorRollingList collectors={sceneCollectors} />
          <div className="panel" style={{ marginTop: 10 }}>
            连接: {connectionStatus} | 数据延迟: {stale ? '是' : '否'} | 最近更新: {lastUpdatedAt ?? '--'}
          </div>
        </aside>
      </div>
    </section>
  );
}
