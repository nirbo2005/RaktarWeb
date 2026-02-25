// raktar-frontend/src/components/Profile/Header.tsx
import { useAuth } from "../../context/AuthContext";

const Header = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const isAdmin = user.rang === "ADMIN";
  const isKezelo = user.rang === "KEZELO";

  // Biztonsági betűvágás: ha nincs név, kérdőjelet adunk vissza
  const getInitial = () => {
    if (user?.nev && user.nev.length > 0) {
      return user.nev.charAt(0).toUpperCase();
    }
    return "?";
  };

  return (
    <header className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 transition-all duration-500 relative">
      {/* Kék banner */}
      <div className="h-32 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800" />

      {/* Fő konténer: mobilon oszlop, asztalin sor */}
      <div className="px-6 md:px-12 flex flex-col md:flex-row gap-4 md:gap-8 pb-8 md:pb-0">

        {/* Avatar - Mindig fel van húzva a kék sávra (-mt-16), mobilon középre igazítva */}
        <div className="flex justify-center md:flex-col md:justify-end md:pb-4 -mt-16 z-10 shrink-0">
          <div className="w-28 h-28 bg-white dark:bg-slate-800 rounded-3xl shadow-2xl flex items-center justify-center text-5xl border-8 border-white dark:border-slate-900 font-black italic text-blue-600 shadow-blue-500/20">
            {getInitial()}
          </div>
        </div>

        {/* Szöveges rész - Asztalin felcsúszik (-mt-16), mobilon természetesen folyik lefelé */}
        <div className="flex-1 flex flex-col md:-mt-16">

          {/* Név */}
          <div className="md:h-16 flex flex-col justify-center md:justify-end md:pb-2">
            <h1 className="text-2xl md:text-4xl font-black uppercase italic tracking-tight drop-shadow-md text-center md:text-left text-slate-900 dark:text-white md:text-white md:dark:text-white">
              {user?.nev || "Névtelen felhasználó"}
            </h1>
          </div>

          {/* Tagek és Gomb */}
          <div className="md:h-16 flex flex-col md:flex-row items-center justify-between gap-4 mt-3 md:mt-0">
            <div className="flex flex-wrap justify-center md:justify-start items-center gap-3">
              <span className="text-slate-500 dark:text-slate-400 md:text-slate-300 font-bold text-[11px] uppercase tracking-widest bg-slate-100 dark:bg-slate-800/60 md:bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/50 backdrop-blur-sm transition-colors">
                @{user?.felhasznalonev}
              </span>
              <span className="text-blue-600 dark:text-blue-400 font-black text-[10px] uppercase tracking-wider bg-blue-100 dark:bg-blue-900/30 px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800/50 backdrop-blur-sm transition-colors">
                {isAdmin ? "🛡️ Admin" : isKezelo ? "📦 Kezelő" : "👁️ Nézelődő"}
              </span>
            </div>
            
            <button
              onClick={logout}
              className="w-full md:w-auto bg-red-500 hover:bg-red-600 text-white px-6 py-3 md:py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 border border-red-400/20"
            >
              <span>🚪</span> Kijelentkezés
            </button>
          </div>
        </div>

      </div>
    </header>
  );
};

export default Header;