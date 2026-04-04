export function formatDateTime(value?: string): string {
  if (!value) {
    return '--';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '--';
  }

  return date.toLocaleString('zh-CN', { hour12: false });
}

export function isDataStale(updatedAt: string | undefined, pollingMs: number): boolean {
  if (!updatedAt) {
    return false;
  }
  const updated = new Date(updatedAt).getTime();
  if (Number.isNaN(updated)) {
    return false;
  }
  return Date.now() - updated > pollingMs * 2;
}
