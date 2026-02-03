import { createContext, useState, useContext, type ReactNode } from "react";
// Importáljuk a központi User típust
import { type User } from "../types";

interface AuthContextType {
  user: User | null;
  loginUser: (data: { access_token: string; user: User }) => void;
  logout: () => void;
  isLoggedIn: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("user");
    // Ha van mentett user, visszaalakítjuk objektummá
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const loginUser = (data: { access_token: string; user: User }) => {
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loginUser, logout, isLoggedIn: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
