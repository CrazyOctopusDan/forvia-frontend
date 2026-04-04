import { sortCollectorsForBoard } from '@/entities/collector/model';
import type { CollectorRealtime } from '@/shared/types/contracts';
import { formatDateTime } from '@/shared/lib/time';

export function CollectorRollingList({ collectors }: { collectors: CollectorRealtime[] }) {
  const sorted = sortCollectorsForBoard(collectors);

  return (
    <section className="panel" style={{ maxHeight: 540, overflow: 'auto' }}>
      <h3 style={{ marginTop: 0 }}>采集器实时列表</h3>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>温度</th>
            <th>震动</th>
            <th>状态</th>
            <th>更新时间</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((item) => (
            <tr key={item.collectorId}>
              <td>{item.collectorId}</td>
              <td>{item.temp}</td>
              <td>{item.vib}</td>
              <td>
                <span className={`tag ${item.status}`}>{item.status}</span>
              </td>
              <td>{formatDateTime(item.updatedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
