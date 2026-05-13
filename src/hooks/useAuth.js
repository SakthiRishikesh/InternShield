"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";

export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const hydrating = useAuthStore((state) => state.hydrating);
  const initialized = useAuthStore((state) => state.initialized);
  const hydrateUser = useAuthStore((state) => state.hydrateUser);

  useEffect(() => {
    if (!initialized && !hydrating) {
      hydrateUser();
    }
  }, [hydrateUser, hydrating, initialized]);

  useEffect(() => {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) {
      return;
    }

    const channel = new BroadcastChannel("internshield-auth");
    channel.onmessage = (event) => {
      if (event.data?.type === "logout") {
        useAuthStore.setState({
          user: null,
          loading: false,
          initialized: true,
          error: null,
        });
      }

      if (event.data?.type === "user") {
        useAuthStore.setState({
          user: event.data.user,
          loading: false,
          initialized: true,
          error: null,
        });
      }
    };

    return () => channel.close();
  }, []);

  return {
    user,
    loading,
    hydrating,
    initialized,
    isAuthenticated: Boolean(user),
  };
}
