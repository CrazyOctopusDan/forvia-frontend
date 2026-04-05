import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ThemeMode = 'dark' | 'light';

interface ShellState {
  menuCollapsed: boolean;
  theme: ThemeMode;
  toggleMenu: () => void;
  toggleTheme: () => void;
}

export const useShellStore = create<ShellState>()(
  persist(
    (set, get) => ({
      menuCollapsed: false,
      theme: 'dark',
      toggleMenu: () => set({ menuCollapsed: !get().menuCollapsed }),
      toggleTheme: () => set({ theme: get().theme === 'dark' ? 'light' : 'dark' })
    }),
    { name: 'forvia-shell' }
  )
);
