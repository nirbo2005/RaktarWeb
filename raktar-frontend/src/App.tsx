//raktar-frontend/src/App.tsx
import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, useLocation, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import ProductList from "./components/ProductList";
import ProductDetails from "./components/ProductDetails";
import ProductAdd from "./components/ProductAdd";
import ProductModify from "./components/ProductModify";
import ProductGridView from "./components/ProductGridView";
import Login from "./components/Login";
import Register from "./components/Register";
import Profile from "./components/Profile"
import ScannerView from "./components/ScannerView";
import SearchResults from "./components/SearchResults";
import type { UserRole } from "./types/User";

const ProtectedRoute = ({ allowedRoles }: { allowedRoles?: UserRole[] }) => {
  const { user, token } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.rang)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

const PublicRoute = () => {
  const { token } = useAuth();
  if (token) {
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
            className="fixed bottom-4 right-4 z-50 p-3 rounded-full bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700"
          >
            {isDark ? "☀️" : "🌙"}
          </button>

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow w-full">
            <Routes>
              <Route element={<PublicRoute />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
              </Route>

              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<ProductList />} />
                <Route path="/product/:id" element={<ProductDetails />} />
                <Route path="/grid" element={<ProductGridView />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/scanner" element={<ScannerView />} />
                <Route path="/search" element={<SearchResults />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={["KEZELO", "ADMIN"]} />}>
                <Route path="/add" element={<ProductAdd />} />
                <Route path="/modify/:id" element={<ProductModify />} />
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