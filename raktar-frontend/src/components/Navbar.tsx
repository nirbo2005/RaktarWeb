import { Link, useLocation } from "react-router-dom";

function Navbar() {
  const location = useLocation();

  // Segédfüggvény, hogy lássuk, melyik menüpont aktív
  const isActive = (path: string) => location.pathname === path;

  const linkStyle = (path: string) => `
    px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200
    ${isActive(path) 
      ? "bg-blue-600 text-white shadow-md shadow-blue-200" 
      : "text-gray-300 hover:bg-gray-700 hover:text-white"}
  `;

  return (
    <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* LOGO / CÍM */}
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <span className="text-xl">📦</span>
            </div>
            <span className="text-white font-black tracking-tighter text-xl">
              RAKTÁR<span className="text-blue-500">WEB</span>
            </span>
          </div>

          {/* MENÜPONTOK */}
          <div className="hidden md:flex items-center gap-2">
            <Link to="/" className={linkStyle("/")}>
              🏠 Termékek
            </Link>
            <Link to="/grid" className={linkStyle("/grid")}>
              📊 Raktár áttekintése
            </Link>
          </div>

          {/* ÚJ TERMÉK GOMB (Kiemelve) */}
          <div className="flex items-center gap-4">
            <Link 
              to="/add" 
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-emerald-900/20 transition-all active:scale-95 flex items-center gap-2"
            >
              <span>+</span> Új termék
            </Link>
          </div>

        </div>
      </div>
      
      {/* MOBIL NÉZET (Csak ikonok alulra vagy egyszerűsítve) */}
      <div className="md:hidden flex justify-around p-2 border-t border-gray-800 bg-gray-900">
          <Link to="/" className="text-gray-400 text-xs flex flex-col items-center">
            <span className="text-lg">🏠</span> Lista
          </Link>
          <Link to="/grid" className="text-gray-400 text-xs flex flex-col items-center">
            <span className="text-lg">📊</span> Térkép
          </Link>
      </div>
    </nav>
  );
}

export default Navbar;