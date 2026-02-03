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

  const handleLogClick = (log: AuditLog) => {
    if (!log.stockId) return;
    if (!log.stock && !user?.admin) {
      alert(
        "Ehhez a művelethez nincs jogosultságod, fordulj az adminhoz segítségért!",
      );
      return;
    }

    navigate(`/modify/${log.stockId}`);
  };

  if (!user)
    return (
      <div className="p-10 text-center text-gray-500 font-bold">
        Bejelentkezés szükséges...
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto py-12 px-6 space-y-10 animate-fade-in">
      <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 transition-all hover:shadow-indigo-100">
        <div className="h-32 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
        <div className="px-10 pb-10">
          <div className="relative -top-10 flex flex-wrap items-end gap-6">
            <div className="w-32 h-32 bg-white rounded-3xl shadow-2xl flex items-center justify-center text-5xl border-8 border-white">
              {user.admin ? "🛡️" : "📦"}
            </div>
            <div className="pb-4 min-w-[200px]">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                {user.nev}
              </h1>
              <p className="text-slate-500 text-base font-semibold flex items-center gap-2">
                <span className="opacity-60 font-mono text-sm">
                  @{user.felhasznalonev}
                </span>
                <span className="text-slate-300">•</span>
                <span
                  className={
                    user.admin ? "text-indigo-600" : "text-emerald-500"
                  }
                >
                  {user.admin ? "Rendszergazda" : "Raktáros munkatárs"}
                </span>
              </p>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6 mt-2">
            <button
              onClick={logout}
              className="group flex items-center gap-3 text-red-500 hover:text-red-700 font-bold text-sm transition-all"
            >
              <span className="bg-red-50 p-2 rounded-xl group-hover:bg-red-100 transition-colors text-lg">
                🚪
              </span>
              Kijelentkezés a rendszerből
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 p-10">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-4 uppercase tracking-tighter">
            <span className="p-3 bg-slate-50 rounded-2xl">📜</span>
            {user.admin ? "Rendszerszintű napló" : "Saját tevékenységeid"}
          </h2>
          <div className="bg-indigo-50 text-indigo-600 px-5 py-2 rounded-2xl font-black text-[11px] border border-indigo-100 tracking-widest uppercase">
            {logs.length} bejegyzés
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-y-2">
            <thead>
              <tr className="text-slate-400 text-[11px] uppercase tracking-[0.2em] font-black">
                <th className="px-4 pb-4">Időpont</th>
                <th className="px-4 pb-4">Művelet</th>
                <th className="px-4 pb-4">Termék</th>
                {user.admin && <th className="px-4 pb-4">Személy</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td
                    colSpan={user.admin ? 4 : 3}
                    className="py-20 text-center text-slate-400 font-bold italic"
                  >
                    Logok betöltése...
                  </td>
                </tr>
              ) : logs.length > 0 ? (
                logs.map((log) => {
                  const isLinkable = log.stockId && (log.stock || user.admin);

                  return (
                    <tr
                      key={log.id}
                      onClick={() => handleLogClick(log)}
                      className={`group transition-all rounded-2xl ${
                        isLinkable
                          ? "hover:bg-slate-50 cursor-pointer"
                          : "cursor-default opacity-60"
                      }`}
                    >
                      <td className="p-4 text-xs text-slate-500 font-mono font-medium tracking-tight">
                        {new Date(log.idopont).toLocaleString("hu-HU")}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                            log.muvelet === "CREATE"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                              : log.muvelet === "DELETE"
                                ? "bg-rose-50 text-rose-700 border-rose-100"
                                : log.muvelet === "RESTORE"
                                  ? "bg-amber-50 text-amber-700 border-amber-100"
                                  : "bg-sky-50 text-sky-700 border-sky-100"
                          }`}
                        >
                          {log.muvelet === "CREATE"
                            ? "Létrehozás"
                            : log.muvelet === "DELETE"
                              ? "Törlés"
                              : log.muvelet === "RESTORE"
                                ? "Visszaállítás"
                                : "Módosítás"}
                        </span>
                      </td>
                      <td className="p-4 text-sm font-bold text-slate-700">
                        {log.stock?.nev || (
                          <span className="text-slate-300 italic font-medium">
                            Eltávolított termék
                          </span>
                        )}
                        {isLinkable && (
                          <span className="opacity-0 group-hover:opacity-100 text-indigo-400 ml-3 transition-all inline-block translate-x-[-10px] group-hover:translate-x-0 font-normal">
                            ↗
                          </span>
                        )}
                      </td>
                      {user.admin && (
                        <td className="p-4 text-sm font-medium text-slate-500">
                          <span className="bg-slate-100 px-3 py-1 rounded-lg text-xs tracking-tight">
                            {log.user.nev}
                          </span>
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={user.admin ? 4 : 3}
                    className="py-20 text-center text-slate-400 italic"
                  >
                    Nincs még rögzített tevékenység.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Profile;
