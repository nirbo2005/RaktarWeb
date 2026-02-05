import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect, useRef } from "react";
import { getProducts } from "../services/api";
import { useDarkMode } from "../hooks/useDarkMode";
import type { Product } from "../types/Product";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isLoggedIn } = useAuth();
  const [isDark, setIsDark] = useDarkMode();

  const [searchTerm, setSearchTerm] = useState("");
  const [quickResults, setQuickResults] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getProducts().then(setAllProducts).catch(console.error);
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  useEffect(() => {
    if (searchTerm.trim().length > 1) {
      const filtered = allProducts
        .filter(
          (p) =>
            p.nev.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.gyarto.toLowerCase().includes(searchTerm.toLowerCase()),
        )
        .slice(0, 5);
      setQuickResults(filtered);
    } else {
      setQuickResults([]);
    }
  }, [searchTerm, allProducts]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
      setSearchTerm("");
    }
  };

  const isActive = (path: string) => location.pathname === path;

  const linkStyle = (path: string) => `
    px-4 py-3 md:py-2 rounded-xl text-sm font-bold transition-all
    ${
      isActive(path)
        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
        : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
    }
  `;

  const DarkModeToggle = () => (
    <button
      onClick={() => setIsDark(!isDark)}
      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xl border border-slate-200 dark:border-slate-700 transition-all active:scale-90 shadow-sm"
    >
      {isDark ? "☀️" : "🌙"}
    </button>
  );

  return (
    <nav className="bg-white dark:bg-black border-b border-slate-200 dark:border-slate-800 sticky top-0 z-[100] shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 md:gap-4">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 focus:outline-none"
          >
            <div className="w-6 h-5 relative flex flex-col justify-between">
              <span
                className={`h-0.5 w-full bg-current transform transition duration-300 ${isMenuOpen ? "rotate-45 translate-y-2.5" : ""}`}
              ></span>
              <span
                className={`h-0.5 w-full bg-current transition duration-300 ${isMenuOpen ? "opacity-0" : ""}`}
              ></span>
              <span
                className={`h-0.5 w-full bg-current transform transition duration-300 ${isMenuOpen ? "-rotate-45 -translate-y-2.5" : ""}`}
              ></span>
            </div>
          </button>

          <div
            className="flex items-center gap-2 shrink-0 cursor-pointer group"
            onClick={() => navigate("/")}
          >
            <div className="bg-blue-600 p-1.5 rounded-lg shadow-inner group-hover:scale-105 transition-transform">
              <span className="text-xl leading-none">📦</span>
            </div>
            <span className="text-slate-900 dark:text-white font-black tracking-tighter text-xl hidden sm:inline italic">
              RAKTÁR<span className="text-blue-500 font-black">WEB</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1 shrink-0">
            <Link to="/" className={linkStyle("/")}>
              🏠 Termékek
            </Link>
            <Link to="/grid" className={linkStyle("/grid")}>
              📊 Áttekintés
            </Link>
            <Link to="/scanner" className={linkStyle("/scanner")}>
              📷 Beolvasás
            </Link>
          </div>

          <div className="flex-1 max-w-md relative mx-2" ref={searchRef}>
            <form onSubmit={handleSearchSubmit}>
              <div className="relative group">
                <input
                  type="text"
                  placeholder="Keresés..."
                  className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder-slate-400 dark:placeholder-slate-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </form>

            {quickResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-[110] overflow-hidden">
                {quickResults.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      navigate(`/product/${p.id}`);
                      setSearchTerm("");
                    }}
                    className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer border-b border-slate-100 dark:border-slate-800 last:border-0 flex justify-between items-center transition-colors"
                  >
                    <div>
                      <div className="text-slate-900 dark:text-white font-bold text-sm">
                        {p.nev}
                      </div>
                      <div className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">
                        {p.gyarto}
                      </div>
                    </div>
                    <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded text-[10px] font-black uppercase italic">
                      {p.parcella}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden md:flex items-center gap-3">
              <DarkModeToggle />
              {isLoggedIn ? (
                <>
                  <Link to="/profile" className={linkStyle("/profile")}>
                    <span className="text-lg">👤</span>{" "}
                    <span className="hidden lg:inline dark:text-slate-200">
                      {user?.nev}
                    </span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/40 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 px-3 py-2 rounded-xl text-xs font-bold border border-transparent dark:border-slate-700 transition-all active:scale-95"
                  >
                    Kilépés
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/register"
                    className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-3 py-2 text-sm font-bold transition-all"
                  >
                    Regisztráció
                  </Link>
                  <Link
                    to="/login"
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                  >
                    Belépés
                  </Link>
                </div>
              )}
            </div>

            {!isLoggedIn && (
              <div className="md:hidden flex items-center gap-2">
                <DarkModeToggle />
                <Link
                  to="/login"
                  className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold"
                >
                  Belépés
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        className={`md:hidden overflow-hidden transition-all duration-300 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-black ${isMenuOpen ? "max-h-[500px]" : "max-h-0"}`}
      >
        <div className="px-4 py-4 space-y-2">
          <Link to="/" className={linkStyle("/")}>
            🏠 Termékek
          </Link>
          <Link to="/grid" className={linkStyle("/grid")}>
            📊 Áttekintés
          </Link>
          <Link to="/scanner" className={linkStyle("/scanner")}>
            📷 Beolvasás
          </Link>

          <hr className="border-slate-200 dark:border-slate-800 my-4" />

          {!isLoggedIn ? (
            <div className="grid grid-cols-2 gap-2">
              <Link
                to="/login"
                className="bg-blue-600 text-white p-3 rounded-xl text-sm font-bold text-center shadow-lg shadow-blue-500/20"
              >
                Belépés
              </Link>
              <Link
                to="/register"
                className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white p-3 rounded-xl text-sm font-bold text-center"
              >
                Regisztráció
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              <Link to="/profile" className={linkStyle("/profile")}>
                👤 Profil ({user?.nev})
              </Link>
              <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-bold text-sm">
                  Sötét mód
                </span>
                <DarkModeToggle />
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-4 text-red-500 dark:text-red-400 font-bold hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all flex items-center gap-3"
              >
                <span>🚪</span> Kilépés
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
