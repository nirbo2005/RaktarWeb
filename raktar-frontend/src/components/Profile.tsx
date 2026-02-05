/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { getAuditLogs } from "../services/api";
import type { AuditLog } from "../types";

function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setLoading(true);
      getAuditLogs(user.id, user.admin)
        .then((data) => setLogs(data))
        .catch((err) => console.error("Hiba a logok betöltésekor:", err))
        .finally(() => setLoading(false));
    }
  }, [user]);

  const formatChange = (log: AuditLog) => {
    if (log.muvelet === "CREATE") return "✨ Új termék hozzáadva";
    if (log.muvelet === "DELETE") return "🗑️ Termék törölve";
    if (log.muvelet === "RESTORE") return "♻️ Termék visszaállítva";

    if (log.muvelet === "UPDATE" && log.regiAdat && log.ujAdat) {
      const changes: string[] = [];
      const oldVal = log.regiAdat;
      const newVal = log.ujAdat;

      Object.keys(newVal).forEach((key) => {
        if (key in oldVal && oldVal[key] !== newVal[key]) {
          const displayOld = key === "lejarat" ? new Date(oldVal[key]).toLocaleDateString() : oldVal[key];
          const displayNew = key === "lejarat" ? new Date(newVal[key]).toLocaleDateString() : newVal[key];
          
          const labels: Record<string, string> = {
            nev: "Név",
            ar: "Ár",
            mennyiseg: "Készlet",
            parcella: "Hely",
            gyarto: "Gyártó"
          };
          
          changes.push(`${labels[key] || key}: ${displayOld} ➔ ${displayNew}`);
        }
      });

      return changes.length > 0 ? `📝 ${changes.join(", ")}` : "Módosítás történt";
    }
    return "-";
  };

  const handleLogClick = (log: AuditLog) => {
    if (!log.stockId) return;
    navigate(`/product/${log.stockId}`);
  };

  if (!user) return <div className="p-10 text-center text-gray-500 font-black uppercase tracking-widest italic animate-pulse">Bejelentkezés szükséges...</div>;

  return (
    <div className="max-w-7xl mx-auto py-12 px-6 space-y-10 animate-in fade-in duration-700 transition-colors duration-500">
      
      {/* 1. Profil fejléc - Sci-fi stílusban */}
      <div className="bg-white dark:bg-slate-900/60 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 backdrop-blur-xl">
        <div className="h-40 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 relative overflow-hidden">
            {/* Dekoratív neon körök */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-20 w-32 h-32 bg-blue-400/20 rounded-full blur-2xl"></div>
        </div>
        <div className="px-6 md:px-10 pb-10">
          <div className="relative -top-12 flex flex-col md:flex-row items-center md:items-end gap-6">
            <div className="w-32 h-32 bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl flex items-center justify-center text-5xl border-8 border-white dark:border-slate-900 transition-transform hover:rotate-3">
              {user.admin ? "🛡️" : "📦"}
            </div>
            <div className="pb-4 text-center md:text-left">
              <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic leading-none">{user.nev}</h1>
              <p className="text-slate-500 dark:text-blue-400 font-black uppercase text-xs tracking-[0.2em] mt-2">
                @{user.felhasznalonev} • <span className="text-indigo-500">{user.admin ? "Rendszergazda" : "Raktárkezelő"}</span>
              </p>
            </div>
            <div className="md:ml-auto pb-4">
                <button 
                    onClick={logout} 
                    className="group bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest border border-red-500/20 transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-red-500/5"
                >
                    <span className="group-hover:animate-bounce">🚪</span> Kijelentkezés
                </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Audit Log - Táblázat sötét módra szabva */}
      <div className="bg-white dark:bg-slate-900/40 rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-800 p-6 md:p-10 backdrop-blur-2xl">
        <div className="flex items-center gap-4 mb-10">
            <div className="h-10 w-2 bg-blue-600 rounded-full shadow-lg shadow-blue-500/40"></div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">📜 Tevékenységi Napló</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-y-3">
            <thead>
              <tr className="text-slate-400 dark:text-slate-600 text-[10px] uppercase tracking-[0.3em] font-black italic">
                <th className="px-6 pb-4">Esemény</th>
                <th className="px-6 pb-4">Termék</th>
                <th className="px-6 pb-4">Részletek</th>
                <th className="px-6 pb-4">Személy</th>
                <th className="px-6 pb-4">Időpont</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-transparent">
              {loading ? (
                <tr><td colSpan={5} className="py-20 text-center text-slate-400 font-black uppercase text-xs tracking-widest animate-pulse italic">Logok betöltése...</td></tr>
              ) : logs.length > 0 ? (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => handleLogClick(log)}
                    className="group transition-all hover:translate-x-1"
                  >
                    {/* 1. Művelettípus - Neon badge-ek */}
                    <td className="p-0">
                      <div className={`m-1 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider border transition-all group-hover:shadow-lg ${
                        log.muvelet === "CREATE" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white shadow-emerald-500/5" :
                        log.muvelet === "DELETE" ? "bg-rose-500/10 text-rose-500 border-rose-500/20 group-hover:bg-rose-500 group-hover:text-white shadow-rose-500/5" :
                        log.muvelet === "RESTORE" ? "bg-amber-500/10 text-amber-500 border-amber-500/20 group-hover:bg-amber-500 group-hover:text-white shadow-amber-500/5" : 
                        "bg-blue-500/10 text-blue-500 border-blue-500/20 group-hover:bg-blue-500 group-hover:text-white shadow-blue-500/5"
                      }`}>
                        {log.muvelet === "CREATE" ? "Létrehozás" : log.muvelet === "DELETE" ? "Törlés" : log.muvelet === "RESTORE" ? "Visszaállítás" : "Módosítás"}
                      </div>
                    </td>

                    {/* 2. Termék */}
                    <td className="px-6">
                      <span className="text-sm font-black text-blue-600 dark:text-blue-400 group-hover:underline transition-all decoration-2 underline-offset-4">
                        {log.stock?.nev || <span className="text-slate-300 dark:text-slate-700 italic font-bold">#Törölt Termék</span>}
                      </span>
                    </td>

                    {/* 3. Módosítás */}
                    <td className="px-6">
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-bold italic tracking-tight leading-relaxed block max-w-md">
                        {formatChange(log)}
                      </span>
                    </td>

                    {/* 4. Személy */}
                    <td className="px-6">
                      <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl uppercase tracking-widest border border-slate-200 dark:border-slate-700">
                        {log.user.nev}
                      </span>
                    </td>

                    {/* 5. Időpont */}
                    <td className="px-6 text-[10px] text-slate-400 dark:text-slate-600 font-mono font-black italic">
                      {new Date(log.idopont).toLocaleString("hu-HU")}
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={5} className="py-24 text-center text-slate-400 dark:text-slate-600 italic font-black uppercase text-sm tracking-[0.3em]">Nincs rögzített tevékenység.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Profile;