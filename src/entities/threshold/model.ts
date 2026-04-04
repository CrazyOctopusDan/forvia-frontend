import type { ThresholdConfig } from '@/shared/types/contracts';

function hasMaxThreeDecimals(value: number): boolean {
  return Number.isInteger(value * 1000);
}

export function validateThreshold(input: Omit<ThresholdConfig, 'collectorId' | 'updatedAt'>): string | null {
  if (input.tempWarn >= input.tempAlarm || input.vibWarn >= input.vibAlarm) {
    return 'THRESHOLD_INVALID_RANGE';
  }

  const numbers = [input.tempWarn, input.tempAlarm, input.vibWarn, input.vibAlarm];
  if (numbers.some((value) => value <= 0)) {
    return 'THRESHOLD_INVALID_RANGE';
  }

  if (numbers.some((value) => !hasMaxThreeDecimals(value))) {
    return 'THRESHOLD_INVALID_RANGE';
  }

  return null;
}
