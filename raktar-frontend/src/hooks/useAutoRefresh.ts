import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * Hook, amely automatikusan újrafuttatja a megadott függvényt,
 * ha a központi AuthContext frissítési jelet küld (WebSocket vagy Reconnect).
 */
export const useAutoRefresh = (refreshFn: () => void) => {
  const { refreshKey } = useAuth();

  useEffect(() => {
    // Lefut az első rendereléskor, és minden alkalommal, 
    // amikor a refreshKey értéke megnő az AuthContext-ben.
    refreshFn();
  }, [refreshKey, refreshFn]); 
};