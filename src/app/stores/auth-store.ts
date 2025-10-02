import { create } from 'zustand';

type AuthState = {
  isConnected: boolean;
  address?: string | null;
  hydrated: boolean;
  setConnected: (v: boolean, address?: string | null) => void;
  setHydrated: (v: boolean) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  isConnected: false,
  address: null,
  hydrated: false,
  setConnected: (v, address) => set({ isConnected: v, address: address ?? null }),
  setHydrated: (v) => set({ hydrated: v })
}));
