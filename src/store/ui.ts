"use client";
import { create } from "zustand";

interface UIState {
  searchOpen: boolean;
  menuOpen: boolean;
  toast: { id: number; message: string } | null;
  setSearch: (v: boolean) => void;
  setMenu: (v: boolean) => void;
  notify: (message: string) => void;
}

export const useUI = create<UIState>((set) => ({
  searchOpen: false,
  menuOpen: false,
  toast: null,
  setSearch: (searchOpen) => set({ searchOpen }),
  setMenu: (menuOpen) => set({ menuOpen }),
  notify: (message) => set({ toast: { id: Date.now(), message } }),
}));
