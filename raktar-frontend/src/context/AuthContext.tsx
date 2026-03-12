// raktar-frontend/src/context/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { User } from "../types/User";
import { socket } from "../services/socket";
import { getMe, triggerNotificationCheck } from "../services/api";
import { useTranslation } from "react-i18next";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: User, rememberMe?: boolean) => void;
  logout: (reason?: string) => void;
  setUser: (user: User | null) => void;
  socket: any;
  refreshKey: number;
  triggerGlobalRefresh: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { i18n } = useTranslation();

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("token") || sessionStorage.getItem("token");
  });

  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("user") || sessionStorage.getItem("user");
    return saved && saved !== "undefined" ? JSON.parse(saved) : null;
  });

  const [loading, setLoading] = useState(!!token && !user);
  const [refreshKey, setRefreshKey] = useState(0);

  const applyUserPreferences = useCallback((userData: User) => {
    if (userData.language && userData.language !== i18n.language) {
      i18n.changeLanguage(userData.language);
      localStorage.setItem("language", userData.language);
    }
    
    if (userData.theme) {
      localStorage.setItem("theme", userData.theme);
      if (userData.theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      // Esemény kiváltása az App.tsx számára
      window.dispatchEvent(new CustomEvent("theme-changed", { detail: userData.theme }));
    }
  }, [i18n]);

  const triggerGlobalRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  const logout = useCallback((reason?: string) => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    const url = reason ? `/login?reason=${reason}` : "/login";
    window.location.href = url;
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      if (token && !user) {
        try {
          const updatedUser = await getMe();
          setUser(updatedUser);
          
          if (localStorage.getItem("token")) {
            localStorage.setItem("user", JSON.stringify(updatedUser));
          } else {
            sessionStorage.setItem("user", JSON.stringify(updatedUser));
          }
          
          applyUserPreferences(updatedUser);
          triggerNotificationCheck().catch(console.error);
        } catch (e) {
          console.error("Auth inicializálási hiba");
          logout();
        }
      } else if (user) {
        applyUserPreferences(user);
      }
      setLoading(false);
    };

    initAuth();
  }, [token, user, logout, applyUserPreferences]);

  useEffect(() => {
    const handleOnline = () => triggerGlobalRefresh();
    window.addEventListener("server-online", handleOnline);

    if (user) {
      socket.emit("join_user_room", { userId: user.id });
      socket.on("products_updated", triggerGlobalRefresh);

      socket.on("notifications_updated", (data: any) => {
        if (
          data.global ||
          (data.userId && Number(data.userId) === Number(user.id))
        ) {
          window.dispatchEvent(new CustomEvent("notifications_updated"));
          triggerGlobalRefresh();
        }
      });

      socket.on("force_logout", (data: { userId: number; reason?: string }) => {
        if (Number(data.userId) === Number(user?.id)) {
          logout(data.reason || "session_expired");
        }
      });

      socket.on("user_updated", async (data: any) => {
        if (Number(data.id || data.userId) === Number(user?.id)) {
          if (window.location.pathname === "/force-change-password") return;
          
          if (data.felhasznalonev && (data.avatarUrl !== undefined || data.nev || data.theme || data.language)) {
            const newUserState = { ...user, ...data };
            setUser(newUserState);
            
            if (localStorage.getItem("token")) {
              localStorage.setItem("user", JSON.stringify(newUserState));
            } else {
              sessionStorage.setItem("user", JSON.stringify(newUserState));
            }
            applyUserPreferences(newUserState);
          } else {
            try {
              const updatedUser = await getMe();
              setUser(updatedUser);
              if (localStorage.getItem("token")) {
                localStorage.setItem("user", JSON.stringify(updatedUser));
              } else {
                sessionStorage.setItem("user", JSON.stringify(updatedUser));
              }
              applyUserPreferences(updatedUser);
            } catch (err) {
              console.error("Szinkron hiba a getMe hívásakor:", err);
            }
          }
        }
      });
    }

    return () => {
      window.removeEventListener("server-online", handleOnline);
      socket.off("products_updated");
      socket.off("notifications_updated");
      socket.off("force_logout");
      socket.off("user_updated");
    };
  }, [user, triggerGlobalRefresh, logout, applyUserPreferences]);

  const login = (newToken: string, userData: User, rememberMe: boolean = false) => {
    if (rememberMe) {
      localStorage.setItem("token", newToken);
      localStorage.setItem("user", JSON.stringify(userData));
    } else {
      sessionStorage.setItem("token", newToken);
      sessionStorage.setItem("user", JSON.stringify(userData));
    }
    
    setToken(newToken);
    setUser(userData);
    applyUserPreferences(userData);
    
    socket.emit("join_user_room", { userId: userData.id });
    triggerGlobalRefresh();
    triggerNotificationCheck().catch(console.error);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        setUser,
        socket,
        refreshKey,
        triggerGlobalRefresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};