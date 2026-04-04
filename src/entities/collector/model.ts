import type { CollectorRealtime } from '@/shared/types/contracts';

const statusPriority: Record<CollectorRealtime['status'], number> = {
  alarm: 3,
  warn: 2,
  normal: 1
};

export function sortCollectorsForBoard(input: CollectorRealtime[]): CollectorRealtime[] {
  return [...input].sort((a, b) => {
    const statusDiff = statusPriority[b.status] - statusPriority[a.status];
    if (statusDiff !== 0) {
      return statusDiff;
    }
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}
