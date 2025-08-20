import { create } from "zustand";

export interface User {
  id: string;
  email: string;
  name: string | null;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // API actions
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  error: null,

  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  login: async (email, password) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Login failed");
      }

      const data = await response.json();
      set({
        user: data.user,
        isLoading: false,
        error: null,
      });

      return true;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Login failed",
        isLoading: false,
      });
      return false;
    }
  },

  logout: async () => {
    set({ isLoading: true });

    try {
      await fetch("/api/auth/logout", { method: "POST" });
      set({
        user: null,
        isLoading: false,
        error: null,
      });
    } catch {
      set({
        error: "Logout failed",
        isLoading: false,
      });
    }
  },

  checkAuth: async () => {
    set({ isLoading: true });

    try {
      const response = await fetch("/api/auth/me");

      if (response.ok) {
        const data = await response.json();
        set({
          user: data.user,
          isLoading: false,
        });
      } else {
        set({
          user: null,
          isLoading: false,
        });
      }
    } catch {
      set({
        user: null,
        isLoading: false,
      });
    }
  },
}));
