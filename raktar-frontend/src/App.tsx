// raktar-frontend/src/App.tsx
import "./i18n";
import { useEffect, useState, type ReactNode } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Navigate,
  Outlet,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { updateUserPreferences } from "./services/api";

import Navbar from "./components/Auxiliary/Navbar";
import ScannerView from "./components/Auxiliary/ScannerView";
import SearchResults from "./components/Auxiliary/SearchResults";
import { ConnectionStatus } from "./components/Auxiliary/ConnectionStatus";
import LanguageSelector from "./components/Auxiliary/LanguageSelector";

import ProductList from "./components/Product/ProductList";
import ProductDetails from "./components/Product/ProductDetails";
import ProductAdd from "./components/Product/ProductAdd";
import ProductModify from "./components/Product/ProductModify";
import ProductGridView from "./components/Product/ProductGridView";

import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import ForgotPassword from "./components/Auth/ForgotPassword";
import ForceChangePassword from "./components/Auth/ForceChangePassword";

import ProfileIndex from "./components/Profile/ProfileIndex";
import ProfileDetails from "./components/Profile/ProfileDetails";
import ProfileLogs from "./components/Profile/ProfileLogs";
import ProfileAdmin from "./components/Profile/ProfileAdmin";
import ProfileStats from "./components/Profile/ProfileStats";
import ProfileSystem from "./components/Profile/ProfileSystem";

import Notifications from "./components/Auxiliary/Notification";
import StockValue from "./components/Profile/ProfileValue";

import type { UserRole } from "./types/User";

const ProtectedRoute = ({ allowedRoles }: { allowedRoles?: UserRole[] }) => {
  const { user, token, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  const rawToken = localStorage.getItem("token") || sessionStorage.getItem("token");
  
  if (!rawToken)
    return <Navigate to="/login" state={{ from: location }} replace />;

  if (!token || !user) return null;

  if (
    user.mustChangePassword &&
    location.pathname !== "/force-change-password"
  ) {
    return <Navigate to="/force-change-password" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.rang)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

const PublicRoute = () => {
  const { token, loading } = useAuth();
  const rawToken = localStorage.getItem("token") || sessionStorage.getItem("token");
  if (loading) return null;
  if (token || rawToken) return <Navigate to="/" replace />;
  return <Outlet />;
};

const ForceChangeRoute = ({ children }: { children: ReactNode }) => {
  const { token, user, loading } = useAuth();
  const rawToken = localStorage.getItem("token") || sessionStorage.getItem("token");
  if (loading) return null;
  if (!token && !rawToken)
    return <Navigate to="/login" replace />;
  if (user && !user.mustChangePassword) return <Navigate to="/" replace />;
  return <>{children}</>;
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

function AppContent() {
  const { user } = useAuth();
  const [isDark, setIsDark] = useState(
    () => localStorage.getItem("theme") === "dark",
  );

  useEffect(() => {
    const handleThemeChange = (e: any) => {
      setIsDark(e.detail === "dark");
    };
    window.addEventListener("theme-changed", handleThemeChange);
    return () => window.removeEventListener("theme-changed", handleThemeChange);
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  const toggleTheme = async () => {
    const newTheme = !isDark ? "dark" : "light";
    setIsDark(!isDark);
    
    if (user) {
      try {
        await updateUserPreferences(user.id, { theme: newTheme });
      } catch (err) {
        console.error("Hiba a téma mentésekor:", err);
      }
    }
  };

  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="min-h-screen bg-main text-main font-sans flex flex-col transition-colors duration-300">
        <Navbar />
        <ConnectionStatus />

        <div className="fixed bottom-6 right-6 z-[150] flex flex-col gap-4 items-end">
          <LanguageSelector />
          <button
            onClick={toggleTheme}
            className="w-14 h-14 rounded-2xl bg-panel text-main shadow-xl border border-main hover:scale-110 active:scale-95 transition-all text-2xl flex items-center justify-center"
          >
            {isDark ? "🌙" : "☀️"}
          </button>
        </div>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow w-full">
          <Routes>
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
            </Route>

            <Route
              path="/force-change-password"
              element={
                <ForceChangeRoute>
                  <ForceChangePassword />
                </ForceChangeRoute>
              }
            />

            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Navigate to="/products/1" replace />} />
              <Route path="/products/:page" element={<ProductList />} />
              <Route path="/product/:id" element={<ProductDetails />} />
              <Route path="/grid" element={<ProductGridView />} />
              <Route path="/profile" element={<ProfileIndex />} />
              <Route path="/profile/details" element={<ProfileDetails />} />
              <Route path="/profile/logs" element={<ProfileLogs />} />
              <Route path="/profile/stats" element={<ProfileStats />} />
              
              <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
                <Route path="/profile/admin" element={<ProfileAdmin />} />
                <Route path="/profile/system" element={<ProfileSystem />} />
              </Route>

              <Route path="/scanner" element={<ScannerView />} />
              <Route path="/search" element={<SearchResults />} />
              <Route path="/notifications" element={<Notifications />} />
            </Route>

            <Route
              element={<ProtectedRoute allowedRoles={["KEZELO", "ADMIN"]} />}
            >
              <Route path="/add" element={<ProductAdd />} />
              <Route path="/modify/:id" element={<ProductModify />} />
              <Route path="/stock-value" element={<StockValue />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;