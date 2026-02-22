//raktar-frontend/src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { User } from "../types/User";
import { socket } from "../services/socket";
import { getMe } from "../services/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: (reason?: string) => void;
  setUser: (user: User | null) => void;
  socket: any;
  refreshKey: number;
  triggerGlobalRefresh: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("user");
    return saved && saved !== "undefined" ? JSON.parse(saved) : null;
  });
  
  const [loading, setLoading] = useState(!!token && !user);
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerGlobalRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  const logout = useCallback((reason?: string) => {
    setToken(null);
    setUser(null);
    localStorage.clear();
    const url = reason ? `/login?reason=${reason}` : "/login";
    window.location.href = url;
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      if (token && !user) {
        try {
          const updatedUser = await getMe();
          setUser(updatedUser);
          localStorage.setItem("user", JSON.stringify(updatedUser));
        } catch (e) {
          console.error("Auth inicializálási hiba");
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [token, user, logout]);

  useEffect(() => {
    const handleOnline = () => triggerGlobalRefresh();
    window.addEventListener('server-online', handleOnline);

    if (user) {
      socket.emit('join_user_room', { userId: user.id });
      socket.on("products_updated", triggerGlobalRefresh);
      
      socket.on("notifications_updated", (data: any) => {
        if (data.global || (data.userId && Number(data.userId) === Number(user.id))) {
          triggerGlobalRefresh();
        }
      });

      socket.on("force_logout", (data: { userId: number; reason?: string }) => {
        if (Number(data.userId) === Number(user?.id)) {
          // Ha a szerver küld konkrét indokot, azt adjuk át (pl. 'banned')
          logout(data.reason || "session_expired");
        }
      });

      socket.on("user_updated", async (data: any) => {
        if (Number(data.id || data.userId) === Number(user?.id)) {
          if (window.location.pathname === "/force-change-password") return;
          try {
            const updatedUser = await getMe();
            setUser(updatedUser);
            localStorage.setItem("user", JSON.stringify(updatedUser));
          } catch (err) {
            console.error("Szinkron hiba", err);
          }
        }
      });
    }

    return () => {
      window.removeEventListener('server-online', handleOnline);
      socket.off("products_updated");
      socket.off("notifications_updated");
      socket.off("force_logout");
      socket.off("user_updated");
    };
  }, [user, triggerGlobalRefresh, logout]);

  const login = (newToken: string, userData: User) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    socket.emit('join_user_room', { userId: userData.id });
    triggerGlobalRefresh();
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, setUser, socket, refreshKey, triggerGlobalRefresh }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};