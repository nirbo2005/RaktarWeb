import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isLoggedIn } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const linkStyle = (path: string) => `
    px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2
    ${isActive(path) 
      ? "bg-blue-600 text-white shadow-md shadow-blue-900/20" 
      : "text-gray-300 hover:bg-gray-800 hover:text-white"}
  `;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* LOGO */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <span className="text-xl">📦</span>
            </div>
            <span className="text-white font-black tracking-tighter text-xl hidden sm:inline">
              RAKTÁR<span className="text-blue-500">WEB</span>
            </span>
          </div>

          {/* MENÜPONTOK (Csak ha be van lépve) */}
          <div className="hidden md:flex items-center gap-1">
            <Link to="/" className={linkStyle("/")}>
              <span>🏠</span> Termékek
            </Link>
            <Link to="/grid" className={linkStyle("/grid")}>
              <span>📊</span> Áttekintés
            </Link>
            {isLoggedIn && (
              <Link to="/add" className={linkStyle("/add")}>
                <span className="text-emerald-400">+</span> Új termék
              </Link>
            )}
          </div>

          {/* AUTH MŰVELETEK */}
          <div className="flex items-center gap-2 sm:gap-4">
            {isLoggedIn ? (
              <>
                {/* PROFIL ÉS LOGOUT */}
                <Link to="/profile" className={linkStyle("/profile")}>
                  <span className="hidden sm:inline">👤 {user?.nev}</span>
                  <span className="sm:hidden">👤</span>
                </Link>
                <button 
                  onClick={handleLogout}
                  className="bg-gray-800 hover:bg-red-900/40 text-red-400 px-4 py-2 rounded-xl text-sm font-bold border border-red-900/20 transition-all"
                >
                  Kilépés
                </button>
              </>
            ) : (
              <>
                {/* BEJELENTKEZÉS / REGISZTRÁCIÓ */}
                <Link 
                  to="/login" 
                  className={`text-sm font-bold px-4 py-2 transition-colors ${
                    isActive("/login") ? "text-blue-400" : "text-gray-400 hover:text-white"
                  }`}
                >
                  Belépés
                </Link>
                <Link 
                  to="/register" 
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-blue-900/20 transition-all"
                >
                  Regisztráció
                </Link>
              </>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}

export default Navbar;