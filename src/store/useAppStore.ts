import { create } from 'zustand';

export type User = {
  id: string | null;
  name: string | null;
  skillLevel: string | null;
};

export type AppSettings = {
  trainingModeEnabled: boolean;
};

export type AppStoreState = {
  user: User;
  settings: AppSettings;
  offline: boolean;
  hasCompletedOnboarding: boolean;
  authToken: string | null;
  setUser: (partial: Partial<User>) => void;
  setSettings: (partial: Partial<AppSettings>) => void;
  setOffline: (offline: boolean) => void;
  setHasCompletedOnboarding: (done: boolean) => void;
  setAuthToken: (token: string | null) => void;
};

export const useAppStore = create<AppStoreState>((set) => ({
  user: { id: null, name: null, skillLevel: null },
  settings: { trainingModeEnabled: true },
  offline: true,
  hasCompletedOnboarding: false,
  authToken: null,
  setUser: (partial) =>
    set((s) => ({ user: { ...s.user, ...partial } })),
  setSettings: (partial) =>
    set((s) => ({ settings: { ...s.settings, ...partial } })),
  setOffline: (offline) => set({ offline }),
  setHasCompletedOnboarding: (done) =>
    set({ hasCompletedOnboarding: done }),
  setAuthToken: (token) => set({ authToken: token }),
}));
