import { create } from "zustand";
import { api } from "@/lib/api";

const AUTH_CHANNEL = "internshield-auth";

function broadcastAuth(message) {
  if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;

  const channel = new BroadcastChannel(AUTH_CHANNEL);
  channel.postMessage(message);
  channel.close();
}

export const useAuthStore = create((set, get) => ({
  user: null,
  loading: false,
  hydrating: false,
  initialized: false,
  error: null,

  setUser: (user) => {
    set({ user, initialized: true });
    broadcastAuth({ type: "user", user });
  },

  hydrateUser: async () => {
    if (get().hydrating) {
      return get().user;
    }

    set({ hydrating: true, error: null });

    try {
      const data = await api.auth.me();
      set({
        user: data.user,
        hydrating: false,
        initialized: true,
        error: null,
      });
      return data.user;
    } catch (err) {
      set({
        user: null,
        hydrating: false,
        initialized: true,
        error: null,
      });
      return null;
    }
  },

  register: async (formData) => {
    set({ loading: true, error: null });

    try {
      const data = await api.auth.register(formData);
      set({
        user: data.user,
        loading: false,
        initialized: true,
        error: null,
      });
      broadcastAuth({ type: "user", user: data.user });
      return { success: true, user: data.user };
    } catch (err) {
      set({ loading: false, error: err.message, initialized: true });
      return { success: false, error: err.message };
    }
  },

  login: async (formData) => {
    set({ loading: true, error: null });

    try {
      const data = await api.auth.login(formData);
      set({
        user: data.user,
        loading: false,
        initialized: true,
        error: null,
      });
      broadcastAuth({ type: "user", user: data.user });
      return { success: true, user: data.user };
    } catch (err) {
      set({ loading: false, error: err.message, initialized: true });
      return { success: false, error: err.message };
    }
  },

  logout: async () => {
    set({ loading: true, error: null });

    try {
      await api.auth.logout();
      set({ user: null, loading: false, initialized: true, error: null });
      broadcastAuth({ type: "logout" });
      return { success: true };
    } catch (err) {
      set({ loading: false, error: err.message });
      return { success: false, error: err.message };
    }
  },

  clearError: () => set({ error: null }),
}));
