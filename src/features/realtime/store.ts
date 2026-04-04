import { create } from 'zustand';
import type { RealtimeConnectionStatus } from '@/shared/types/contracts';

interface RealtimeState {
  connectionStatus: RealtimeConnectionStatus;
  lastUpdatedAt?: string;
  setConnectionStatus: (status: RealtimeConnectionStatus) => void;
  setLastUpdatedAt: (time: string) => void;
}

export const useRealtimeStore = create<RealtimeState>((set) => ({
  connectionStatus: 'reconnecting',
  lastUpdatedAt: undefined,
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
  setLastUpdatedAt: (lastUpdatedAt) => set({ lastUpdatedAt })
}));
