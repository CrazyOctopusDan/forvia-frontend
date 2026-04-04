import { formatDateTime } from '@/shared/lib/time';
import type { DashboardSnapshot, RealtimeConnectionStatus } from '@/shared/types/contracts';

export function TopKPI({
  snapshot,
  connectionStatus,
  dataStale,
  lastUpdatedAt
}: {
  snapshot: DashboardSnapshot;
  connectionStatus: RealtimeConnectionStatus;
  dataStale: boolean;
  lastUpdatedAt?: string;
}) {
  return (
    <section className="panel">
      <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div className="row">
          <strong>活动告警：</strong>
          <span className="tag alarm">{snapshot.alarmSummary.activeAlarm}</span>
          <span className="tag warn">{snapshot.alarmSummary.activeWarn}</span>
        </div>
        <div className="row">
          <strong>连接状态：</strong>
          <span>{connectionStatus}</span>
        </div>
        <div className="row">
          <strong>最后更新时间：</strong>
          <span>{formatDateTime(lastUpdatedAt ?? snapshot.updatedAt)}</span>
        </div>
        {dataStale ? <span className="error-text">数据延迟（超过 2 个采集周期）</span> : null}
      </div>
    </section>
  );
}
