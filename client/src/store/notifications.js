import { create } from 'zustand';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  add: (listing) => set((state) => ({
    notifications: [{ ...listing, isUrgent: false, seenAt: Date.now() }, ...state.notifications]
  })),
  addUrgent: (listing) => set((state) => ({
    notifications: [{ ...listing, isUrgent: true, seenAt: Date.now() }, ...state.notifications]
  })),
  clear: () => set({ notifications: [] }),
  markAllRead: () => set((state) => ({
    notifications: state.notifications.map(n => ({ ...n, read: true }))
  }))
}));
