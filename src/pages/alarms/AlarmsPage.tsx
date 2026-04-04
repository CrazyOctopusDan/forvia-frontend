import { useEffect, useMemo, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { useAckAlarmMutation, useActiveAlarmsQuery, useCollectorHistoryQuery, useHistoryAlarmsQuery, useIgnoreAlarmMutation } from '@/features/alarms/api';
import { sortActiveAlarms } from '@/entities/alarm/model';
import { formatDateTime } from '@/shared/lib/time';
import type { HistoryRange, MetricType } from '@/shared/types/contracts';

type TabKey = 'active' | 'history' | 'trend';

export function AlarmsPage() {
  const [tab, setTab] = useState<TabKey>('active');
  const [range, setRange] = useState<HistoryRange>('day');
  const [metric, setMetric] = useState<MetricType>('temp');
  const [collectorId, setCollectorId] = useState('C001');
  const chartRef = useRef<HTMLDivElement | null>(null);

  const activeQuery = useActiveAlarmsQuery();
  const historyQuery = useHistoryAlarmsQuery(range);
  const trendQuery = useCollectorHistoryQuery(collectorId, metric, range);
  const ackMutation = useAckAlarmMutation();
  const ignoreMutation = useIgnoreAlarmMutation();

  const activeRows = useMemo(() => sortActiveAlarms(activeQuery.data ?? []), [activeQuery.data]);

  useEffect(() => {
    if (!chartRef.current || tab !== 'trend' || !trendQuery.data) {
      return;
    }

    const chart = echarts.init(chartRef.current);
    chart.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: trendQuery.data.points.map((item) => item.timestamp.slice(5, 16)) },
      yAxis: { type: 'value' },
      series: [
        {
          type: 'line',
          smooth: true,
          data: trendQuery.data.points.map((item) => item.value),
          lineStyle: { color: metric === 'temp' ? '#ff8f64' : '#67d3ff' }
        }
      ]
    });
    return () => chart.dispose();
  }, [metric, tab, trendQuery.data]);

  return (
    <section style={{ display: 'grid', gap: 12 }}>
      <h2 className="page-title">报警中心与处理</h2>
      <section className="panel row">
        <button onClick={() => setTab('active')} disabled={tab === 'active'}>
          活动报警
        </button>
        <button onClick={() => setTab('history')} disabled={tab === 'history'}>
          历史报警
        </button>
        <button onClick={() => setTab('trend')} disabled={tab === 'trend'}>
          历史趋势
        </button>
        <select value={range} onChange={(e) => setRange(e.target.value as HistoryRange)}>
          <option value="day">day</option>
          <option value="week">week</option>
          <option value="month">month</option>
        </select>
      </section>

      {tab === 'active' ? (
        <section className="panel">
          <table>
            <thead>
              <tr>
                <th>alarmId</th>
                <th>collectorId</th>
                <th>metric</th>
                <th>actualValue</th>
                <th>threshold</th>
                <th>occurredAt</th>
                <th>status</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {activeRows.map((row) => (
                <tr key={row.eventId}>
                  <td>{row.alarmId}</td>
                  <td>{row.collectorId}</td>
                  <td>{row.metricType}</td>
                  <td>{row.actualValue}</td>
                  <td>{row.threshold}</td>
                  <td>{formatDateTime(row.occurredAt)}</td>
                  <td>{row.status}</td>
                  <td className="row">
                    <button onClick={() => ackMutation.mutate(row.alarmId)} disabled={ackMutation.isPending}>
                      确认
                    </button>
                    <button onClick={() => ignoreMutation.mutate(row.alarmId)} disabled={ignoreMutation.isPending}>
                      忽略
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      {tab === 'history' ? (
        <section className="panel">
          <table>
            <thead>
              <tr>
                <th>alarmId</th>
                <th>collectorId</th>
                <th>level</th>
                <th>status</th>
                <th>occurredAt</th>
                <th>ackedBy</th>
                <th>ackedAt</th>
              </tr>
            </thead>
            <tbody>
              {(historyQuery.data ?? []).map((row) => (
                <tr key={`${row.eventId}-${row.status}`}>
                  <td>{row.alarmId}</td>
                  <td>{row.collectorId}</td>
                  <td>{row.level}</td>
                  <td>{row.status}</td>
                  <td>{formatDateTime(row.occurredAt)}</td>
                  <td>{row.ackedBy ?? '--'}</td>
                  <td>{formatDateTime(row.ackedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      {tab === 'trend' ? (
        <section className="panel">
          <div className="row" style={{ marginBottom: 10 }}>
            <input value={collectorId} onChange={(e) => setCollectorId(e.target.value)} placeholder="collectorId" />
            <select value={metric} onChange={(e) => setMetric(e.target.value as MetricType)}>
              <option value="temp">temp</option>
              <option value="vib">vib</option>
            </select>
          </div>
          <div ref={chartRef} style={{ height: 420 }} />
        </section>
      ) : null}
    </section>
  );
}
