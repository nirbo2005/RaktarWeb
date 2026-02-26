//raktar-frontend/src/hooks/useAutoRefresh.ts
import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export const useAutoRefresh = (refreshFn: () => void) => {
  const { refreshKey } = useAuth();

  useEffect(() => {
    refreshFn();
  }, [refreshKey, refreshFn]);
};
