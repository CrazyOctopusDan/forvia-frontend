import { sortCollectorsForBoard } from '@/entities/collector/model';
import type { CollectorRealtime } from '@/shared/types/contracts';
import { formatDateTime } from '@/shared/lib/time';

export function CollectorRollingList({ collectors }: { collectors: CollectorRealtime[] }) {
  const sorted = sortCollectorsForBoard(collectors);
  const renderRows = sorted.length > 0 ? [...sorted, ...sorted] : [];

  return (
    <section className="panel collector-board">
      <h3 className="collector-board-title">采集器监控列表</h3>
      <div className="collector-board-decor" />
      <div className="collector-scroll-viewport">
        <div
          className="collector-scroll-track"
          style={{ animationDuration: `${Math.max(16, sorted.length * 1.6)}s`, animationPlayState: sorted.length <= 6 ? 'paused' : 'running' }}
        >
          {renderRows.map((item, index) => (
            <article key={`${item.collectorId}-${index}`} className="collector-item-card">
              <div className="collector-item-id">
                <div>采集器</div>
                <div>{item.collectorId}</div>
              </div>
              <div className="collector-item-meta">
                <span className="collector-meta-label">运行状态</span>
                <span className={`tag ${item.status}`}>{item.status}</span>
                <span className="collector-meta-label">温度</span>
                <span>{item.temp.toFixed(1)}°C</span>
                <span className="collector-meta-label">震动</span>
                <span>{item.vib.toFixed(3)} g</span>
                <span className="collector-meta-label">更新时间</span>
                <span>{formatDateTime(item.updatedAt)}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
      <div className="collector-board-footer">
        <span>总数: {sorted.length}</span>
        <span>告警: {sorted.filter((item) => item.status === 'alarm').length}</span>
      </div>
    </section>
  );
}
