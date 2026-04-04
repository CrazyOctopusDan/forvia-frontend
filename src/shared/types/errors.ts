export const ERROR_MESSAGE_MAP: Record<string, string> = {
  DASHBOARD_SNAPSHOT_UNAVAILABLE: '快照不可用，已尝试展示本地缓存快照。',
  REALTIME_PULL_FAILED: '实时拉取失败，系统已进入降级模式。',
  DATA_STALE: '数据已过期，请检查采集链路。',
  LAYOUT_NOT_FOUND: '未找到历史布局，已使用默认布局。',
  LAYOUT_VALIDATION_FAILED: '布局数据校验失败，请检查坐标与分区。',
  LAYOUT_SAVE_CONFLICT: '布局版本冲突，请刷新后重试。',
  THRESHOLD_INVALID_RANGE: '阈值区间不合法，请确保预警值小于报警值。',
  THRESHOLD_SYNC_TARGET_EMPTY: '请先选择批量同步目标采集器。',
  THRESHOLD_SAVE_FAILED: '阈值保存失败，请稍后重试。',
  ALARM_NOT_FOUND: '报警不存在，可能已被处理。',
  ALARM_ALREADY_ACKED: '报警已确认，无需重复操作。',
  ALARM_ACK_FORBIDDEN: '当前账号无报警确认权限。',
  HISTORY_RANGE_INVALID: '历史查询时间范围不合法。',
  HISTORY_DATA_EMPTY: '当前时间范围无历史数据。',
  HISTORY_QUERY_TIMEOUT: '历史查询超时，请缩小时间范围后重试。',
  UNKNOWN_ERROR: '系统繁忙，请稍后重试。'
};

export function getErrorMessage(code?: string): string {
  if (!code) {
    return ERROR_MESSAGE_MAP.UNKNOWN_ERROR;
  }

  return ERROR_MESSAGE_MAP[code] ?? ERROR_MESSAGE_MAP.UNKNOWN_ERROR;
}
