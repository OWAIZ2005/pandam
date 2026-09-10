/**
 * Global client/UI state (Zustand). NOT for server data — that belongs to
 * TanStack Query. Keep this store small: things like theme, onboarding flags,
 * transient banners.
 */
import { create } from 'zustand';

export type ColorScheme = 'light' | 'dark' | 'system';

interface UiState {
  colorScheme: ColorScheme;
  hasCompletedOnboarding: boolean;
  setColorScheme: (scheme: ColorScheme) => void;
  completeOnboarding: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  colorScheme: 'system',
  hasCompletedOnboarding: false,
  setColorScheme: (colorScheme) => set({ colorScheme }),
  completeOnboarding: () => set({ hasCompletedOnboarding: true }),
}));
