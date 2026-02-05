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
        .filter(p => p.nev.toLowerCase().includes(searchTerm.toLowerCase()) || 
                     p.gyarto.toLowerCase().includes(searchTerm.toLowerCase()))
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
    px-4 py-3 md:py-2 rounded-xl text-sm font-bold transition-all duration-200 flex items-center gap-3
    ${isActive(path) 
      ? "bg-blue-600 text-white shadow-lg" 
      : "text-gray-400 dark:text-gray-400 hover:bg-gray-800 dark:hover:bg-gray-800 hover:text-white"}
  `;

  const DarkModeToggle = () => (
    <button 
      onClick={() => setIsDark(!isDark)}
      className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 text-xl border border-gray-700 transition-all active:scale-90"
    >
      {isDark ? "☀️" : "🌙"}
    </button>
  );

  return (
    <nav className="bg-gray-900 dark:bg-black border-b border-gray-800 sticky top-0 z-[100] shadow-xl transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 md:gap-4">
          
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-gray-400 hover:text-white focus:outline-none"
          >
            <div className="w-6 h-5 relative flex flex-col justify-between">
              <span className={`h-0.5 w-full bg-current transform transition duration-300 ${isMenuOpen ? 'rotate-45 translate-y-2.5' : ''}`}></span>
              <span className={`h-0.5 w-full bg-current transition duration-300 ${isMenuOpen ? 'opacity-0' : ''}`}></span>
              <span className={`h-0.5 w-full bg-current transform transition duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-2.5' : ''}`}></span>
            </div>
          </button>

          <div className="flex items-center gap-2 shrink-0 cursor-pointer" onClick={() => navigate("/")}>
            <div className="bg-blue-600 p-1.5 rounded-lg shadow-inner">
              <span className="text-xl leading-none">📦</span>
            </div>
            <span className="text-white font-black tracking-tighter text-xl hidden sm:inline italic">
              RAKTÁR<span className="text-blue-500">WEB</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1 shrink-0">
            <Link to="/" className={linkStyle("/")}>🏠 Termékek</Link>
            <Link to="/grid" className={linkStyle("/grid")}>📊 Áttekintés</Link>
            <Link to="/scanner" className={linkStyle("/scanner")}>📷 Beolvasás</Link>
          </div>

          <div className="flex-1 max-w-md relative mx-2" ref={searchRef}>
            <form onSubmit={handleSearchSubmit}>
              <input
                type="text"
                placeholder="Keresés..."
                className="w-full bg-gray-800 dark:bg-gray-900 border border-gray-700 text-white text-sm rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </form>

            {quickResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 dark:bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-[110] overflow-hidden">
                {quickResults.map(p => (
                  <div 
                    key={p.id}
                    onClick={() => { navigate(`/product/${p.id}`); setSearchTerm(""); }}
                    className="p-3 hover:bg-gray-700 dark:hover:bg-gray-800 cursor-pointer border-b border-gray-700 flex justify-between items-center"
                  >
                    <div>
                      <div className="text-white font-bold text-sm">{p.nev}</div>
                      <div className="text-gray-400 text-[10px] uppercase font-bold">{p.gyarto}</div>
                    </div>
                    <span className="bg-blue-900/30 text-blue-400 px-2 py-1 rounded text-[10px] font-black">{p.parcella}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden md:flex items-center gap-2">
              <DarkModeToggle />
              {isLoggedIn ? (
                <>
                  <Link to="/profile" className={linkStyle("/profile")}>
                    <span>👤</span> <span className="hidden lg:inline">{user?.nev}</span>
                  </Link>
                  <button 
                    onClick={handleLogout} 
                    className="bg-gray-800 hover:bg-red-900/40 text-red-400 px-3 py-2 rounded-xl text-xs font-bold border border-red-900/20 transition-all"
                  >
                    Kilépés
                  </button>
                </>
              ) : (
                <>
                  <Link to="/register" className="text-gray-400 hover:text-white px-3 py-2 text-sm font-bold transition-all">Regisztráció</Link>
                  <Link to="/login" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-blue-900/20 transition-all">Belépés</Link>
                </>
              )}
            </div>
            
            {!isLoggedIn && (
              <div className="md:hidden flex items-center gap-2">
                <DarkModeToggle />
                <Link to="/login" className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold">Belépés</Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MOBIL MENÜ */}
      <div className={`md:hidden overflow-hidden transition-all duration-300 border-t border-gray-800 bg-gray-900 dark:bg-black ${isMenuOpen ? 'max-h-[500px]' : 'max-h-0'}`}>
        <div className="px-4 py-4 space-y-2">
          <Link to="/" className={linkStyle("/")}>🏠 Termékek</Link>
          <Link to="/grid" className={linkStyle("/grid")}>📊 Áttekintés</Link>
          <Link to="/scanner" className={linkStyle("/scanner")}>📷 Beolvasás</Link>
          
          <hr className="border-gray-800 my-4" />
          
          {!isLoggedIn ? (
            <div className="grid grid-cols-2 gap-2">
              <Link to="/login" className="bg-blue-600 text-white p-3 rounded-xl text-sm font-bold text-center">Belépés</Link>
              <Link to="/register" className="bg-gray-800 text-white p-3 rounded-xl text-sm font-bold text-center">Regisztráció</Link>
            </div>
          ) : (
            <>
              <Link to="/profile" className={linkStyle("/profile")}>👤 Profil ({user?.nev})</Link>
              <button 
                onClick={handleLogout}
                className="w-full text-left px-4 py-4 text-red-400 font-bold hover:bg-red-900/20 rounded-xl transition-all flex items-center gap-3"
              >
                <span>🚪</span> Kilépés a rendszerből
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;