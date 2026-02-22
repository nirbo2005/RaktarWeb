//raktar-frontend/src/components/Auxiliary/Navbar.tsx
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useState, useEffect, useRef, useCallback } from "react";
import { getProducts, getMyNotifications, markNotificationAsRead } from "../../services/api";
import { useAutoRefresh } from "../../hooks/useAutoRefresh";
import type { Product } from "../../types/Product";
import type { AppNotification } from "../../types/Notification";

interface NavbarProps {
  isDark: boolean;
  setIsDark: (val: boolean) => void;
}

function Navbar({ isDark, setIsDark }: NavbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [quickResults, setQuickResults] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    if (user && !user.mustChangePassword && location.pathname !== "/force-change-password") {
      try {
        const [notifs, products] = await Promise.all([
          getMyNotifications(),
          getProducts()
        ]);
        if (notifs) setNotifications(notifs);
        if (products) setAllProducts(products);
      } catch (err) {
        console.error("Navbar adatfrissítési hiba elnyomva");
      }
    }
  }, [user, location.pathname]);

  useAutoRefresh(fetchData);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setQuickResults([]);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
    setIsNotifOpen(false);
    setSearchTerm("");
    setQuickResults([]);
  }, [location]);

  useEffect(() => {
    if (searchTerm.trim().length > 1 && Array.isArray(allProducts)) {
      const filtered = allProducts
        .filter(
          (p) =>
            p?.nev?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p?.gyarto?.toLowerCase().includes(searchTerm.toLowerCase()),
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
      const term = searchTerm.trim();
      setSearchTerm("");
      setQuickResults([]);
      setIsMenuOpen(false);
      navigate(`/search?q=${encodeURIComponent(term)}`);
    }
  };

  const handleNotificationClick = async (id: number) => {
    try {
      await markNotificationAsRead(id);
      fetchData(); 
    } catch (err) {
      console.error("Hiba az értesítés olvasottá tételekor", err);
    }
  };

  const getRoleBadge = (role?: string) => {
    if (role === "ADMIN") return "🛡️ Admin";
    if (role === "KEZELO") return "📦 Kezelő";
    return "👁️ Nézelődő";
  };

  const isActive = (path: string) => location.pathname === path;

  const linkStyle = (path: string) => `
    px-4 py-3 md:py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2
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

  const unreadCount = (notifications || []).filter(n => n && !n.isRead).length;
  const recentNotifications = (notifications || []).slice(0, 5);

  return (
    <nav className="bg-white dark:bg-black border-b border-slate-200 dark:border-slate-800 sticky top-0 z-[100] shadow-sm transition-colors text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 md:gap-4">
          
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 focus:outline-none z-[110]"
          >
            <div className="w-6 h-5 relative flex flex-col justify-between">
              <span className={`h-0.5 w-full bg-current transform transition duration-300 ${isMenuOpen ? "rotate-45 translate-y-2.5" : ""}`}></span>
              <span className={`h-0.5 w-full bg-current transition duration-300 ${isMenuOpen ? "opacity-0" : ""}`}></span>
              <span className={`h-0.5 w-full bg-current transform transition duration-300 ${isMenuOpen ? "-rotate-45 -translate-y-2.5" : ""}`}></span>
            </div>
          </button>

          <div className="flex items-center gap-2 shrink-0 cursor-pointer group" onClick={() => navigate("/")}>
            <div className="bg-blue-600 p-1.5 rounded-lg shadow-inner group-hover:scale-105 transition-transform">
              <span className="text-xl leading-none">📦</span>
            </div>
            <span className="text-slate-900 dark:text-white font-black tracking-tighter text-xl hidden sm:inline italic">
              RAKTÁR<span className="text-blue-500 font-black">WEB</span>
            </span>
          </div>

          {user && !user.mustChangePassword && (
            <div className="hidden md:flex items-center gap-1 shrink-0">
              <Link to="/" className={linkStyle("/")}>🏠 Termékek</Link>
              <Link to="/grid" className={linkStyle("/grid")}>📊 Áttekintés</Link>
              <Link to="/scanner" className={linkStyle("/scanner")}>📷 Beolvasás</Link>
            </div>
          )}

          {user && !user.mustChangePassword && (
            <div className="flex-1 max-w-md relative mx-2 hidden md:block" ref={searchRef}>
              <form onSubmit={handleSearchSubmit}>
                <input
                  type="text"
                  placeholder="Keresés..."
                  className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </form>

              {quickResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-[110] overflow-hidden">
                  {quickResults.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        navigate(`/product/${p.id}`);
                        setSearchTerm("");
                        setQuickResults([]);
                      }}
                      className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer border-b border-slate-100 dark:border-slate-800 last:border-0 flex justify-between items-center transition-colors text-left"
                    >
                      <div>
                        <div className="text-slate-900 dark:text-white font-bold text-sm">{p.nev}</div>
                        <div className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">{p.gyarto}</div>
                      </div>
                      <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded text-[10px] font-black uppercase italic">Ugrás →</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 shrink-0">
            {user && !user.mustChangePassword && (
              <div className="relative" ref={notifRef}>
                <button 
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all active:scale-95 relative"
                >
                  🔔
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 -translate-y-1/3 translate-x-1/3 bg-red-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full border-2 border-white dark:border-black animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {isNotifOpen && (
                  <div className="absolute top-full right-0 mt-3 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-[120] overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 text-left">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                      <span className="font-black text-sm uppercase tracking-widest text-slate-800 dark:text-slate-200">Értesítések</span>
                      {unreadCount > 0 && <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{unreadCount} új</span>}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {recentNotifications.length > 0 ? (
                        recentNotifications.map(n => (
                          <div 
                            key={n.id} 
                            onClick={() => !n.isRead && handleNotificationClick(n.id)}
                            className={`p-4 border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors ${!n.isRead ? 'bg-blue-50/50 dark:bg-blue-900/20 cursor-pointer' : 'opacity-60'}`}
                          >
                            <div className="flex gap-3">
                              <span className="text-lg">{n.tipus === 'ERROR' ? '🚨' : n.tipus === 'WARNING' ? '⚠️' : 'ℹ️'}</span>
                              <div className="flex-1">
                                <p className={`text-xs leading-tight ${!n.isRead ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-500'}`}>{n.uzenet}</p>
                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1 block">{new Date(n.letrehozva).toLocaleString('hu-HU')}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center text-slate-400 font-bold text-xs uppercase tracking-widest">Nincs értesítés</div>
                      )}
                    </div>
                    <div className="p-2 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800">
                      <button 
                        onClick={() => { setIsNotifOpen(false); navigate('/notifications'); }} 
                        className="w-full py-2 text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest hover:underline"
                      >
                        Összes megtekintése →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="hidden md:block">
              <DarkModeToggle />
            </div>

            {user ? (
              <div className="hidden md:flex items-center gap-3">
                <Link to="/profile" className={linkStyle("/profile")}>
                  <div className="w-8 h-8 bg-blue-600/10 text-blue-600 rounded-lg flex items-center justify-center font-black text-xs border border-blue-600/20">
                    {user?.nev ? user.nev.charAt(0).toUpperCase() : (user?.felhasznalonev ? user.felhasznalonev.charAt(0).toUpperCase() : '?')}
                  </div>
                  <div className="flex flex-col items-start leading-none">
                    <span className="dark:text-slate-200 text-xs font-black uppercase tracking-tight">{user?.nev || user?.felhasznalonev}</span>
                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">{getRoleBadge(user?.rang)}</span>
                  </div>
                </Link>
                <button onClick={handleLogout} className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-red-500 transition-all active:scale-95">🚪</button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg transition-all active:scale-95">Belépés</Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <div 
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-black shadow-2xl ${isMenuOpen ? "max-h-[80vh] opacity-100" : "max-h-0 opacity-0"}`}
      >
        <div className="px-4 py-6 space-y-3 text-left">
          {user ? (
            <>
              {!user.mustChangePassword && (
                <div className="mb-4 relative" ref={searchRef}>
                  <form onSubmit={handleSearchSubmit}>
                    <input
                      type="text"
                      placeholder="Keresés..."
                      className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </form>
                </div>
              )}

              {!user.mustChangePassword && (
                <>
                  <Link to="/" className={linkStyle("/")}>🏠 Termékek</Link>
                  <Link to="/grid" className={linkStyle("/grid")}>📊 Áttekintés</Link>
                  <Link to="/scanner" className={linkStyle("/scanner")}>📷 Beolvasás</Link>
                  <Link to="/notifications" className={linkStyle("/notifications")}>🔔 Értesítések {unreadCount > 0 && `(${unreadCount})`}</Link>
                </>
              )}
              
              <div className="h-px bg-slate-200 dark:border-slate-800 my-4" />
              
              <Link to="/profile" className={linkStyle("/profile")}>👤 Profil ({user?.nev || user?.felhasznalonev})</Link>
              
              <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 mt-2">
                <span className="text-slate-500 dark:text-slate-400 font-bold text-sm italic uppercase tracking-widest">Sötét mód</span>
                <DarkModeToggle />
              </div>
              
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-4 text-red-500 font-black uppercase tracking-widest text-xs mt-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl flex items-center gap-3 transition-colors"
              >
                <span>🚪</span> Kijelentkezés
              </button>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Link to="/login" className="bg-blue-600 text-white p-4 rounded-xl text-sm font-bold text-center">Belépés</Link>
              <Link to="/register" className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white p-4 rounded-xl text-sm font-bold text-center">Regisztráció</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;