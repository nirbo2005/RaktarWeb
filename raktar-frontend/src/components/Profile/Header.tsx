// raktar-frontend/src/components/Profile/Header.tsx
import { useAuth } from "../../context/AuthContext";

const Header = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const isAdmin = user.rang === "ADMIN";
  const isKezelo = user.rang === "KEZELO";

  return (
    <header className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 transition-all duration-500">
      <div className="h-32 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800" />
      <div className="px-8 md:px-12 flex flex-col md:flex-row items-stretch gap-8 -mt-16">
        <div className="flex flex-col justify-end pb-4">
          <div className="w-28 h-28 bg-white dark:bg-slate-800 rounded-3xl shadow-2xl flex items-center justify-center text-5xl border-8 border-white dark:border-slate-900 font-black italic text-blue-600 shadow-blue-500/20 z-10 shrink-0">
            {user.nev.charAt(0)}
          </div>
        </div>
        <div className="flex-1 flex flex-col">
          <div className="h-16 flex items-end pb-2">
            <h1 className="text-2xl md:text-4xl font-black text-white uppercase italic tracking-tight drop-shadow-md">
              {user.nev}
            </h1>
          </div>
          <div className="h-16 flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-slate-400 font-bold text-[11px] uppercase tracking-widest bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-700/50 backdrop-blur-sm">
                @{user.felhasznalonev}
              </span>
              <span className="text-blue-400 font-black text-[10px] uppercase tracking-wider bg-blue-900/30 px-3 py-1.5 rounded-xl border border-blue-800/50 backdrop-blur-sm">
                {isAdmin ? "🛡️ Admin" : isKezelo ? "📦 Kezelő" : "👁️ Nézelődő"}
              </span>
            </div>
            <button
              onClick={logout}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-red-500/20 flex items-center gap-2 border border-red-400/20"
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