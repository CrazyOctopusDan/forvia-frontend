export type MetricType = 'temp' | 'vib';
export type CollectorState = 'normal' | 'warn' | 'alarm';
export type AlarmLevel = 'warn' | 'alarm';
export type AlarmStatus = 'triggered' | 'acked' | 'recovered' | 'ignored';
export type HistoryRange = 'day' | 'week' | 'month';
export type RealtimeConnectionStatus = 'connected' | 'reconnecting' | 'fallback-polling';

export interface LayoutNode {
  collectorId: string;
  x: number;
  y: number;
  zIndex: number;
  zone: string;
}

export interface CollectorRealtime {
  collectorId: string;
  collectorName: string;
  temp: number;
  vib: number;
  status: CollectorState;
  zone: string;
  updatedAt: string;
}

export interface ThresholdConfig {
  collectorId: string;
  tempWarn: number;
  tempAlarm: number;
  vibWarn: number;
  vibAlarm: number;
  updatedAt: string;
}

export interface AlarmEvent {
  alarmId: string;
  eventId: string;
  collectorId: string;
  metricType: MetricType;
  level: AlarmLevel;
  threshold: number;
  actualValue: number;
  occurredAt: string;
  status: AlarmStatus;
  ackedBy?: string;
  ackedAt?: string;
}

export interface HistoryPoint {
  timestamp: string;
  value: number;
}

export interface CollectorHistorySeries {
  collectorId: string;
  metric: MetricType;
  range: HistoryRange;
  points: HistoryPoint[];
}

export interface DashboardSnapshot {
  layout: LayoutNode[];
  collectors: CollectorRealtime[];
  alarmSummary: {
    activeWarn: number;
    activeAlarm: number;
    latestAlarmAt?: string;
  };
  pageConfig: {
    autoRotateMs: number;
  };
  updatedAt: string;
}

export interface RealtimeStreamEvent {
  id: string;
  type: 'collector-status' | 'alarm-change' | 'heartbeat';
  sentAt: string;
  payload: unknown;
}

export interface LayoutConfigResponse {
  version: number;
  nodes: LayoutNode[];
}

export interface ThresholdSyncResult {
  collectorId: string;
  success: boolean;
  message?: string;
}
