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

    // Most már a TS tudja, hogy létezik a regiAdat és ujAdat
    if (log.muvelet === "UPDATE" && log.regiAdat && log.ujAdat) {
      const changes: string[] = [];
      const oldVal = log.regiAdat;
      const newVal = log.ujAdat;

      Object.keys(newVal).forEach((key) => {
        // Csak azokat nézzük, amik mindkettőben megvannak és eltérnek
        if (key in oldVal && oldVal[key] !== newVal[key]) {
          const displayOld = key === "lejarat" ? new Date(oldVal[key]).toLocaleDateString() : oldVal[key];
          const displayNew = key === "lejarat" ? new Date(newVal[key]).toLocaleDateString() : newVal[key];
          
          // Mezőnév szépítése (opcionális)
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

  if (!user) return <div className="p-10 text-center text-gray-500 font-bold">Bejelentkezés szükséges...</div>;

  return (
    <div className="max-w-7xl mx-auto py-12 px-6 space-y-10 animate-fade-in">
      {/* Profil fejléc */}
      <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100">
        <div className="h-32 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
        <div className="px-10 pb-10">
          <div className="relative -top-10 flex flex-wrap items-end gap-6">
            <div className="w-32 h-32 bg-white rounded-3xl shadow-2xl flex items-center justify-center text-5xl border-8 border-white">
              {user.admin ? "🛡️" : "📦"}
            </div>
            <div className="pb-4">
              <h1 className="text-3xl font-black text-slate-900">{user.nev}</h1>
              <p className="text-slate-500 font-semibold">@{user.felhasznalonev} • {user.admin ? "Admin" : "Raktáros"}</p>
            </div>
          </div>
          <button onClick={logout} className="text-red-500 font-bold hover:underline flex items-center gap-2">🚪 Kijelentkezés</button>
        </div>
      </div>

      {/* Audit Log Táblázat a kért sorrendben */}
      <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 p-10">
        <h2 className="text-2xl font-black text-slate-800 mb-8 uppercase tracking-tighter">📜 Tevékenységi Napló</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-y-2">
            <thead>
              <tr className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black">
                <th className="px-4 pb-4">Művelettípus</th>
                <th className="px-4 pb-4">Termék</th>
                <th className="px-4 pb-4">Módosítás</th>
                <th className="px-4 pb-4">Személy</th>
                <th className="px-4 pb-4">Időpont</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="py-20 text-center text-slate-400 font-bold">Logok betöltése...</td></tr>
              ) : logs.length > 0 ? (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => handleLogClick(log)}
                    className="group transition-all rounded-2xl hover:bg-slate-50 cursor-pointer"
                  >
                    {/* 1. Művelettípus */}
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase border ${
                        log.muvelet === "CREATE" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                        log.muvelet === "DELETE" ? "bg-rose-50 text-rose-700 border-rose-100" :
                        log.muvelet === "RESTORE" ? "bg-amber-50 text-amber-700 border-amber-100" : "bg-sky-50 text-sky-700 border-sky-100"
                      }`}>
                        {log.muvelet === "CREATE" ? "Létrehozás" : log.muvelet === "DELETE" ? "Törlés" : log.muvelet === "RESTORE" ? "Visszaállítás" : "Módosítás"}
                      </span>
                    </td>

                    {/* 2. Termék */}
                    <td className="p-4">
                      <span className="text-sm font-black text-indigo-600">
                        {log.stock?.nev || <span className="text-slate-300 italic font-medium">Törölt termék</span>}
                      </span>
                    </td>

                    {/* 3. Módosítás */}
                    <td className="p-4">
                      <span className="text-xs text-slate-500 font-medium">
                        {formatChange(log)}
                      </span>
                    </td>

                    {/* 4. Személy */}
                    <td className="p-4">
                      <span className="text-sm font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg">
                        {log.user.nev}
                      </span>
                    </td>

                    {/* 5. Időpont */}
                    <td className="p-4 text-[11px] text-slate-400 font-mono font-bold">
                      {new Date(log.idopont).toLocaleString("hu-HU")}
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={5} className="py-20 text-center text-slate-400 italic font-bold">Nincs rögzített tevékenység.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Profile;