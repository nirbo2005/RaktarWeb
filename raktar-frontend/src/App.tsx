//raktar-frontend/src/App.tsx
import { useEffect, useState, type ReactNode } from "react";
import { BrowserRouter, Routes, Route, useLocation, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

import Navbar from "./components/Auxiliary/Navbar";
import ScannerView from "./components/Auxiliary/ScannerView";
import SearchResults from "./components/Auxiliary/SearchResults";

import ProductList from "./components/Product/ProductList";
import ProductDetails from "./components/Product/ProductDetails";
import ProductAdd from "./components/Product/ProductAdd";
import ProductModify from "./components/Product/ProductModify";
import ProductGridView from "./components/Product/ProductGridView";

import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import ForgotPassword from "./components/Auth/ForgotPassword";
import ForceChangePassword from "./components/Auth/ForceChangePassword";

import Profile from "./components/Profile";

import StockValue from "./components/beta/StockValue";

import type { UserRole } from "./types/User";

const ProtectedRoute = ({ allowedRoles }: { allowedRoles?: UserRole[] }) => {
  const { user, token } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Ha a felhasználónak jelszót kell cserélnie, csak a jelszócsere oldalra mehet!
  if (user?.mustChangePassword) {
    return <Navigate to="/force-change-password" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.rang)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

const PublicRoute = () => {
  const { token, user } = useAuth();
  
  // Ha be van jelentkezve, de jelszót kell cserélnie, oda irányítjuk
  if (token) {
    if (user?.mustChangePassword) {
      return <Navigate to="/force-change-password" replace />;
    }
    return <Navigate to="/profile" replace />;
  }

  return <Outlet />;
};

function ScrollToTop() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }, 0);
  }, [pathname, search]);
  return null;
}

function App() {
  const [isDark, setIsDark] = useState(
    () => localStorage.getItem("theme") === "dark",
  );

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-slate-950 dark:text-slate-100 font-sans flex flex-col transition-colors duration-300">
          <Navbar />
          
          <button
            onClick={() => setIsDark(!isDark)}
            className="fixed bottom-4 right-4 z-50 p-3 rounded-full bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700 hover:scale-110 transition-transform"
            title={isDark ? "Világos mód" : "Sötét mód"}
          >
            {isDark ? "☀️" : "🌙"}
          </button>

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow w-full">
            <Routes>
              {/* PUBLIKUS ROUTE-OK */}
              <Route element={<PublicRoute />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
              </Route>

              {/* JELSZÓCSERE ROUTE - Ezt külön kezeljük, hogy a Protected ne csípje meg */}
              <Route path="/force-change-password" element={
                <ForceChangeRoute>
                  <ForceChangePassword />
                </ForceChangeRoute>
              } />

              {/* VÉDETT ROUTE-OK (Csak ha be van lépve ÉS nem kell jelszót cserélnie) */}
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<ProductList />} />
                <Route path="/product/:id" element={<ProductDetails />} />
                <Route path="/grid" element={<ProductGridView />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/scanner" element={<ScannerView />} />
                <Route path="/search" element={<SearchResults />} />
              </Route>

              {/* ADMIN / KEZELŐ ROUTE-OK */}
              <Route element={<ProtectedRoute allowedRoles={["KEZELO", "ADMIN"]} />}>
                <Route path="/add" element={<ProductAdd />} />
                <Route path="/modify/:id" element={<ProductModify />} />
                
                {/* ÚJ BÉTA ÚTVONAL (Rejtett) */}
                <Route path="/stock-value" element={<StockValue />} />
              </Route>
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

// Speciális Route komponens csak a kötelező jelszócseréhez
const ForceChangeRoute = ({ children }: { children: ReactNode }) => {
  const { token, user } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (user && !user.mustChangePassword) return <Navigate to="/" replace />;
  return <>{children}</>;
};

export default App;