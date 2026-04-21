import { create } from 'zustand';

export type ViewType = 'dashboard' | 'cabins' | 'bookings' | 'students' | 'payments' | 'reports' | 'settings';

interface AppState {
  activeView: ViewType;
  sidebarOpen: boolean;
  setActiveView: (view: ViewType) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeView: 'dashboard',
  sidebarOpen: true,
  setActiveView: (view) => set({ activeView: view }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
