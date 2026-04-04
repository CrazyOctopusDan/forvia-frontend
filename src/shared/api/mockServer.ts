import type { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import type {
  AlarmEvent,
  CollectorHistorySeries,
  CollectorRealtime,
  DashboardSnapshot,
  HistoryPoint,
  HistoryRange,
  LayoutConfigResponse,
  LayoutNode,
  MetricType,
  ThresholdConfig,
  ThresholdSyncResult
} from '@/shared/types/contracts';
import type { ApiResponse } from '@/shared/types/api';

function nowIso(): string {
  return new Date().toISOString();
}

function randomIn(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function fixed(value: number): number {
  return Number(value.toFixed(3));
}

const collectorIds = Array.from({ length: 50 }, (_, i) => `C${String(i + 1).padStart(3, '0')}`);

const thresholdsMap = new Map<string, ThresholdConfig>(
  collectorIds.map((collectorId) => [
    collectorId,
    {
      collectorId,
      tempWarn: 60,
      tempAlarm: 75,
      vibWarn: 3,
      vibAlarm: 4.5,
      updatedAt: nowIso()
    }
  ])
);

let layoutVersion = 1;
let layoutNodes: LayoutNode[] = collectorIds.map((collectorId, index) => ({
  collectorId,
  x: 60 + (index % 10) * 85,
  y: 60 + Math.floor(index / 10) * 75,
  zIndex: index,
  zone: `Z${Math.floor(index / 10) + 1}`
}));

let collectors: CollectorRealtime[] = collectorIds.map((collectorId, index) => ({
  collectorId,
  collectorName: `采集器-${collectorId}`,
  temp: fixed(randomIn(35, 70)),
  vib: fixed(randomIn(1, 4.2)),
  status: index % 17 === 0 ? 'alarm' : index % 7 === 0 ? 'warn' : 'normal',
  zone: `Z${Math.floor(index / 10) + 1}`,
  updatedAt: nowIso()
}));

let alarms: AlarmEvent[] = collectors
  .filter((item) => item.status !== 'normal')
  .map((item, idx) => ({
    alarmId: `A-${idx + 1}`,
    eventId: `E-${idx + 1}`,
    collectorId: item.collectorId,
    metricType: item.status === 'alarm' ? 'temp' : 'vib',
    level: item.status === 'alarm' ? 'alarm' : 'warn',
    threshold: item.status === 'alarm' ? 75 : 3,
    actualValue: item.status === 'alarm' ? item.temp : item.vib,
    occurredAt: nowIso(),
    status: 'triggered'
  }));

function jitterCollectors(): void {
  collectors = collectors.map((item) => {
    const threshold = thresholdsMap.get(item.collectorId);
    const temp = fixed(item.temp + randomIn(-0.8, 0.8));
    const vib = fixed(item.vib + randomIn(-0.25, 0.25));
    const status =
      threshold && (temp >= threshold.tempAlarm || vib >= threshold.vibAlarm)
        ? 'alarm'
        : threshold && (temp >= threshold.tempWarn || vib >= threshold.vibWarn)
          ? 'warn'
          : 'normal';

    return {
      ...item,
      temp: Math.max(temp, 0),
      vib: Math.max(vib, 0),
      status,
      updatedAt: nowIso()
    };
  });

  alarms = collectors
    .filter((item) => item.status !== 'normal')
    .map((item, idx) => ({
      alarmId: `A-${idx + 1}`,
      eventId: `E-${Date.now()}-${idx + 1}`,
      collectorId: item.collectorId,
      metricType: item.status === 'alarm' ? 'temp' : 'vib',
      level: item.status === 'alarm' ? 'alarm' : 'warn',
      threshold: item.status === 'alarm' ? 75 : 3,
      actualValue: item.status === 'alarm' ? item.temp : item.vib,
      occurredAt: nowIso(),
      status: 'triggered'
    }));
}

function summaryFromAlarms(): DashboardSnapshot['alarmSummary'] {
  const activeWarn = alarms.filter((item) => item.level === 'warn').length;
  const activeAlarm = alarms.filter((item) => item.level === 'alarm').length;
  const latestAlarmAt = alarms.length > 0 ? alarms[0].occurredAt : undefined;

  return { activeWarn, activeAlarm, latestAlarmAt };
}

function response<T>(data: T): AxiosResponse<ApiResponse<T>> {
  const config = { headers: {} } as InternalAxiosRequestConfig;
  return {
    config,
    data: { success: true, data },
    headers: {},
    status: 200,
    statusText: 'OK'
  };
}

function fail(code: string, message?: string, status = 400): AxiosResponse<ApiResponse<never>> {
  const config = { headers: {} } as InternalAxiosRequestConfig;
  return {
    config,
    data: { success: false, code, message },
    headers: {},
    status,
    statusText: 'ERROR'
  };
}

function parseUrl(config: AxiosRequestConfig): URL {
  return new URL(config.url ?? '', 'http://mock.local');
}

function collectorHistory(collectorId: string, metric: MetricType, range: HistoryRange): CollectorHistorySeries {
  const length = 30;
  const points: HistoryPoint[] = Array.from({ length }, (_, index) => {
    const base = metric === 'temp' ? 55 : 2.6;
    const wave = Math.sin(index / 4) * (metric === 'temp' ? 8 : 0.8);
    return {
      timestamp: new Date(Date.now() - (length - index) * 3600_000).toISOString(),
      value: fixed(base + wave + randomIn(-0.4, 0.4))
    };
  });

  return {
    collectorId,
    metric,
    range,
    points
  };
}

export async function mockAdapter(config: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<unknown>>> {
  await new Promise((resolve) => setTimeout(resolve, 80));

  const url = parseUrl(config);
  const method = (config.method ?? 'get').toLowerCase();

  if (method === 'get' && url.pathname === '/v1/dashboard/snapshot') {
    jitterCollectors();
    const snapshot: DashboardSnapshot = {
      layout: layoutNodes,
      collectors,
      alarmSummary: summaryFromAlarms(),
      pageConfig: { autoRotateMs: 20000 },
      updatedAt: nowIso()
    };
    return response(snapshot);
  }

  if (method === 'get' && url.pathname === '/v1/collectors/realtime') {
    jitterCollectors();
    return response(collectors);
  }

  if (method === 'get' && url.pathname === '/v1/alarms/active') {
    return response(alarms);
  }

  if (method === 'get' && url.pathname === '/v1/alarms/history') {
    const history = alarms.map((item, index) => ({
      ...item,
      status: index % 2 === 0 ? 'recovered' : 'acked',
      occurredAt: new Date(Date.now() - (index + 1) * 3600_000).toISOString()
    }));
    return response(history);
  }

  if (method === 'post' && /\/v1\/alarms\/.+\/(ack|ignore)$/.test(url.pathname)) {
    const alarmId = url.pathname.split('/')[3];
    const action = url.pathname.endsWith('/ack') ? 'acked' : 'ignored';
    const alarm = alarms.find((item) => item.alarmId === alarmId);
    if (!alarm) {
      return fail('ALARM_NOT_FOUND');
    }
    alarm.status = action;
    alarm.ackedBy = 'operator';
    alarm.ackedAt = nowIso();
    return response(alarm);
  }

  if (method === 'get' && url.pathname === '/v1/config/layout/collectors') {
    const payload: LayoutConfigResponse = { version: layoutVersion, nodes: layoutNodes };
    return response(payload);
  }

  if (method === 'put' && url.pathname === '/v1/config/layout/collectors') {
    const body = (config.data ? JSON.parse(String(config.data)) : null) as LayoutConfigResponse | null;
    if (!body || !Array.isArray(body.nodes)) {
      return fail('LAYOUT_VALIDATION_FAILED');
    }
    layoutNodes = body.nodes;
    layoutVersion += 1;
    return response({ version: layoutVersion, nodes: layoutNodes } satisfies LayoutConfigResponse);
  }

  if (method === 'get' && url.pathname === '/v1/config/thresholds') {
    return response(Array.from(thresholdsMap.values()));
  }

  if (method === 'put' && /\/v1\/config\/thresholds\/.+/.test(url.pathname)) {
    const collectorId = url.pathname.split('/').pop() ?? '';
    const body = (config.data ? JSON.parse(String(config.data)) : null) as Omit<ThresholdConfig, 'collectorId' | 'updatedAt'> | null;
    if (!thresholdsMap.has(collectorId) || !body) {
      return fail('THRESHOLD_SAVE_FAILED');
    }
    if (body.tempWarn >= body.tempAlarm || body.vibWarn >= body.vibAlarm) {
      return fail('THRESHOLD_INVALID_RANGE');
    }
    thresholdsMap.set(collectorId, {
      collectorId,
      ...body,
      updatedAt: nowIso()
    });
    return response(thresholdsMap.get(collectorId) as ThresholdConfig);
  }

  if (method === 'post' && url.pathname === '/v1/config/thresholds/sync') {
    const body = (config.data ? JSON.parse(String(config.data)) : null) as {
      sourceCollectorId: string;
      targetCollectorIds: string[];
    } | null;

    if (!body || body.targetCollectorIds.length === 0) {
      return fail('THRESHOLD_SYNC_TARGET_EMPTY');
    }

    const source = thresholdsMap.get(body.sourceCollectorId);
    if (!source) {
      return fail('THRESHOLD_SAVE_FAILED');
    }

    const results: ThresholdSyncResult[] = body.targetCollectorIds.map((collectorId) => {
      const existing = thresholdsMap.get(collectorId);
      if (!existing) {
        return { collectorId, success: false, message: 'collector not found' };
      }
      thresholdsMap.set(collectorId, {
        ...existing,
        tempWarn: source.tempWarn,
        tempAlarm: source.tempAlarm,
        vibWarn: source.vibWarn,
        vibAlarm: source.vibAlarm,
        updatedAt: nowIso()
      });
      return { collectorId, success: true };
    });

    return response(results);
  }

  if (method === 'get' && url.pathname === '/v1/collectors/history') {
    const collectorId = url.searchParams.get('collectorId') ?? collectorIds[0];
    const metric = (url.searchParams.get('metric') ?? 'temp') as MetricType;
    const range = (url.searchParams.get('range') ?? 'day') as HistoryRange;

    return response(collectorHistory(collectorId, metric, range));
  }

  return fail('UNKNOWN_ERROR', `No mock handler for ${method.toUpperCase()} ${url.pathname}`, 404);
}
