import { createContext, useState, useContext, type ReactNode } from "react";

// Típusok definiálása
interface User {
  id: number;
  nev: string;
  felhasznalonev: string;
  admin: boolean;
}

interface AuthContextType {
  user: User | null;
  loginUser: (data: { access_token: string; user: User }) => void;
  logout: () => void;
  isLoggedIn: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // A 'savedUser' lekérése közvetlenül az inicializáláskor történik (Lazy initializer)
  // Így elkerüljük a szinkron setState-et az useEffect-ben, ami az ESLint hibát okozta.
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("user");
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
    <AuthContext.Provider value={{ user, loginUser, logout, isLoggedIn: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

// A custom hook-ot sokszor nem szereti az ESLint a komponens mellett exportálni "Fast Refresh" miatt.
// De mivel ez egy Context fájl, így a legegyszerűbb használni:
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};