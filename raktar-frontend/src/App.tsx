import "./i18n";
import { useEffect, useState, type ReactNode } from "react";
import { BrowserRouter, Routes, Route, useLocation, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { useTranslation } from "react-i18next";

import Navbar from "./components/Auxiliary/Navbar";
import ScannerView from "./components/Auxiliary/ScannerView";
import SearchResults from "./components/Auxiliary/SearchResults";
import { ConnectionStatus } from './components/Auxiliary/ConnectionStatus';

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
import Notifications from "./components/Auxiliary/Notification";

import StockValue from "./components/beta/StockValue";

import type { UserRole } from "./types/User";

const ProtectedRoute = ({ allowedRoles }: { allowedRoles?: UserRole[] }) => {
  const { user, token, loading } = useAuth();
  const location = useLocation();

  if (loading) return null; 

  const rawToken = localStorage.getItem("token");
  if (!rawToken) return <Navigate to="/login" state={{ from: location }} replace />;

  if (!token || !user) return null;

  if (user.mustChangePassword && location.pathname !== "/force-change-password") {
    return <Navigate to="/force-change-password" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.rang)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

const PublicRoute = () => {
  const { token, loading } = useAuth();
  const rawToken = localStorage.getItem("token");
  if (loading) return null;
  if (token || rawToken) return <Navigate to="/" replace />;
  return <Outlet />;
};

const ForceChangeRoute = ({ children }: { children: ReactNode }) => {
  const { token, user, loading } = useAuth();
  if (loading) return null;
  if (!token && !localStorage.getItem("token")) return <Navigate to="/login" replace />;
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

function App() {
  const [isDark, setIsDark] = useState(() => localStorage.getItem("theme") === "dark");
  const { i18n } = useTranslation();

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language.startsWith('hu') ? 'en' : 'hu');
  };

  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-slate-950 dark:text-slate-100 font-sans flex flex-col transition-colors duration-300">
          <Navbar isDark={isDark} setIsDark={setIsDark} />
          <ConnectionStatus />
          
          <div className="fixed bottom-4 right-4 z-[150] flex flex-col gap-2">
            <button
              onClick={toggleLanguage}
              className="p-3 rounded-full bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700 hover:scale-110 transition-transform font-black text-xs uppercase"
            >
              {i18n.language.startsWith('hu') ? 'HU' : 'EN'}
            </button>
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-3 rounded-full bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700 hover:scale-110 transition-transform"
            >
              {isDark ? "☀️" : "🌙"}
            </button>
          </div>

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow w-full">
            <Routes>
              <Route element={<PublicRoute />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
              </Route>

              <Route path="/force-change-password" element={
                <ForceChangeRoute>
                  <ForceChangePassword />
                </ForceChangeRoute>
              } />

              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<ProductList />} />
                <Route path="/product/:id" element={<ProductDetails />} />
                <Route path="/grid" element={<ProductGridView />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/scanner" element={<ScannerView />} />
                <Route path="/search" element={<SearchResults />} />
                <Route path="/notifications" element={<Notifications />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={["KEZELO", "ADMIN"]} />}>
                <Route path="/add" element={<ProductAdd />} />
                <Route path="/modify/:id" element={<ProductModify />} />
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

export default App;