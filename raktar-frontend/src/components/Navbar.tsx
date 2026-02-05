import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect, useRef } from "react";
import { getProducts } from "../services/api";
import type { Product } from "../types/Product";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isLoggedIn } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [quickResults, setQuickResults] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
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

  // EZT PÓTOLTUK: A hiányzó logout kezelő
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
    px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2
    ${isActive(path) ? "bg-blue-600 text-white shadow-md" : "text-gray-300 hover:bg-gray-800 hover:text-white"}
  `;

  return (
    <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          <div className="flex items-center gap-2 shrink-0 cursor-pointer" onClick={() => navigate("/")}>
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <span className="text-xl">📦</span>
            </div>
            <span className="text-white font-black tracking-tighter text-xl hidden lg:inline">
              RAKTÁR<span className="text-blue-500">WEB</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1 shrink-0">
            <Link to="/" className={linkStyle("/")}>🏠 Termékek</Link>
            <Link to="/grid" className={linkStyle("/grid")}>📊 Áttekintés</Link>
            <Link to="/scanner" className={linkStyle("/scanner")}>📷 Beolvasás</Link>
          </div>

          <div className="flex-1 max-w-md relative" ref={searchRef}>
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Keresés..."
                  className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </form>

            {quickResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl z-[100]">
                {quickResults.map(p => (
                  <div 
                    key={p.id}
                    onClick={() => { navigate(`/product/${p.id}`); setSearchTerm(""); }}
                    className="p-3 hover:bg-gray-700 cursor-pointer border-b border-gray-700 last:border-0 flex justify-between items-center"
                  >
                    <div>
                      <div className="text-white font-bold text-sm">{p.nev}</div>
                      <div className="text-gray-400 text-xs">{p.gyarto}</div>
                    </div>
                    <span className="text-blue-400 font-mono text-xs">{p.parcella}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isLoggedIn ? (
              <>
                <Link to="/profile" className={linkStyle("/profile")}>
                  <span>👤</span> <span className="hidden sm:inline">{user?.nev}</span>
                </Link>
                <button onClick={handleLogout} className="bg-gray-800 hover:bg-red-900/40 text-red-400 px-3 py-2 rounded-xl text-xs font-bold border border-red-900/20 transition-all">
                  Kilépés
                </button>
              </>
            ) : (
              <Link to="/login" className="bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold">Belépés</Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;