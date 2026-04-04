import type { AlarmEvent } from '@/shared/types/contracts';

const levelRank: Record<AlarmEvent['level'], number> = {
  alarm: 2,
  warn: 1
};

export function sortActiveAlarms(input: AlarmEvent[]): AlarmEvent[] {
  return [...input].sort((a, b) => {
    const byLevel = levelRank[b.level] - levelRank[a.level];
    if (byLevel !== 0) {
      return byLevel;
    }
    return new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime();
  });
}
