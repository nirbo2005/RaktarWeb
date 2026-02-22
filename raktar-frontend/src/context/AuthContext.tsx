import React, { createContext, useContext, useState, useEffect } from "react";
import Swal from "sweetalert2";
import type { User } from "../types/User";
import socket from "../services/socket";
import { getMe } from "../services/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  setUser: (user: User | null) => void;
  socket: any;
  notifTrigger: number;
  refreshNotifications: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [notifTrigger, setNotifTrigger] = useState(0);

  const refreshNotifications = () => {
    setNotifTrigger(prev => prev + 1);
  };

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser && savedUser !== "undefined") {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Hiba a mentett felhasználó betöltésekor");
      }
    }
  }, []);

  useEffect(() => {
    if (user) {
      // 0. CSATLAKOZÁS A SAJÁT SZOBÁHOZ
      socket.emit('join_user_room', { userId: user.id });

      // 1. REAL-TIME KILÉPTETÉS: Ha a szerver jelez (Single Session, Ban, Reset)
      socket.on("force_logout", async (data: { userId: number; reason?: string }) => {
        if (Number(data.userId) === Number(user?.id)) {
          console.log("‼️ FORCE LOGOUT ESEMÉNY ÉRKEZETT");
          // Törlés előtt egy pillanatra álljunk meg
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          // Azonnali ugrás a loginra, ahol a korábban beépített useEffect elkapja a reason-t
          window.location.href = "/login?reason=session_expired";
        }
      });

      // 2. Felhasználó adatok frissítése
      socket.on("user_updated", async (data: any) => {
        const targetId = data.id || data.userId;
        if (Number(targetId) === Number(user.id)) {
          try {
            const updatedUser = await getMe();
            setUser(updatedUser);
            localStorage.setItem("user", JSON.stringify(updatedUser));
            
            if (updatedUser.mustChangePassword) {
               Swal.fire({
                 title: "Biztonsági frissítés",
                 text: "A jelszavad megváltoztatása kötelező!",
                 icon: "info",
                 background: 'rgb(15, 23, 42)',
                 color: '#fff'
               });
            }
          } catch (err) {
            console.error("Hiba a profil szinkronizálásakor", err);
          }
        }
      });

      socket.on("notifications_updated", (data: any) => {
        if (data.global || (data.userId && Number(data.userId) === Number(user.id))) {
          refreshNotifications();
        }
      });
    }

    return () => {
      socket.off("force_logout");
      socket.off("user_updated");
      socket.off("notifications_updated");
    };
  }, [user]);

  const login = (newToken: string, userData: User) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    socket.emit('join_user_room', { userId: userData.id });
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    // Érdemes az oldalt is újratölteni, hogy minden state tisztuljon
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      login, 
      logout, 
      setUser, 
      socket,
      notifTrigger,
      refreshNotifications 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};