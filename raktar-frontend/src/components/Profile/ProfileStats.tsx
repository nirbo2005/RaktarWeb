// raktar-frontend/src/components/Profile/ProfileStats.tsx
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useAutoRefresh } from "../../hooks/useAutoRefresh";
import { useTranslation } from "react-i18next";
import { getAuditLogs } from "../../services/api";

const ProfileStats = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  
  const [stats, setStats] = useState({
    totalActions: 0,
    creates: { total: 0, bulk: 0 },
    updates: { total: 0, bulk: 0 },
    moves: { total: 0, bulk: 0 },
    batches: { total: 0, bulk: 0 },
    deletes: { total: 0, bulk: 0 },
  });
  
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    if (!user) return;
    try {
      const logs = await getAuditLogs(user.id, false, { targetUserId: user.id.toString() });
      
      const counts = logs.reduce((acc: any, log: any) => {
        acc.totalActions++;
        const muvelet = (log.muvelet || "").toUpperCase();
        
        // Tömeges (bulk) műveletek felismerése
        const isBulk = muvelet.includes("BULK") || muvelet.includes("TOMEGES");

        // Kategorizálás
        if (muvelet.includes("BATCH") || muvelet.includes("SARZS")) {
          acc.batches.total++;
          if (isBulk) acc.batches.bulk++;
        } else if (muvelet.includes("MOVE") || muvelet.includes("MOZGAT")) {
          acc.moves.total++;
          if (isBulk) acc.moves.bulk++;
        } else if (muvelet.includes("CREATE") || muvelet.includes("ADD") || muvelet.includes("HOZZAAD")) {
          acc.creates.total++;
          if (isBulk) acc.creates.bulk++;
        } else if (muvelet.includes("UPDATE") || muvelet.includes("MODOSIT")) {
          acc.updates.total++;
          if (isBulk) acc.updates.bulk++;
        } else if (muvelet.includes("DELETE") || muvelet.includes("TOROL")) {
          acc.deletes.total++;
          if (isBulk) acc.deletes.bulk++;
        }
        
        return acc;
      }, { 
        totalActions: 0, 
        creates: { total: 0, bulk: 0 }, 
        updates: { total: 0, bulk: 0 }, 
        moves: { total: 0, bulk: 0 }, 
        batches: { total: 0, bulk: 0 }, 
        deletes: { total: 0, bulk: 0 } 
      });

      setStats(counts);
    } catch (err) {
      console.error(t("profile.stats.fetchError", "Hiba a statisztika betöltésekor"), err);
    } finally {
      setLoading(false);
    }
  }, [user, t]);

  useAutoRefresh(loadStats);

  const statCards = [
    { label: t("profile.stats.totalActions", "Összes"), value: stats.totalActions, icon: "⚡" },
    { label: t("profile.stats.creates", "Hozzáadás"), value: stats.creates.total, icon: "🆕" },
    { label: t("profile.stats.updates", "Módosítás"), value: stats.updates.total, icon: "📝" },
    { label: t("profile.stats.moves", "Mozgatás"), value: stats.moves.total, icon: "🚚" },
    { label: t("profile.stats.batches", "Sarzsok"), value: stats.batches.total, icon: "📦" },
    { label: t("profile.stats.deletes", "Törlés"), value: stats.deletes.total, icon: "🗑️" },
  ];

  const distributionItems = [
    { key: "creates", label: t("profile.stats.creates", "Hozzáadás"), color: "bg-emerald-500", bulkColor: "bg-emerald-700" },
    { key: "updates", label: t("profile.stats.updates", "Módosítás"), color: "bg-amber-500", bulkColor: "bg-amber-700" },
    { key: "moves", label: t("profile.stats.moves", "Termék mozgatás"), color: "bg-purple-500", bulkColor: "bg-purple-700" },
    { key: "batches", label: t("profile.stats.batches", "Sarzs műveletek"), color: "bg-indigo-500", bulkColor: "bg-indigo-700" },
    { key: "deletes", label: t("profile.stats.deletes", "Törlés"), color: "bg-rose-500", bulkColor: "bg-rose-700" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-left transition-colors duration-300 py-6">
      <div className="flex items-center gap-4 mb-4 px-2">
        <button
          onClick={() => navigate("/profile")}
          className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 hover:text-blue-500 transition-colors"
        >
          ←
        </button>
        <h2 className="text-2xl font-black uppercase italic tracking-tighter dark:text-white">
          {t("profile.dashboard.stats.title", "Statisztikák")}
        </h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-500">
          
          {/* Felső kártyák */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
            {statCards.map((card, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                <div className={`absolute -right-4 -top-4 text-6xl opacity-10 group-hover:scale-110 transition-transform`}>{card.icon}</div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-2">{card.label}</p>
                <p className={`text-4xl font-black italic dark:text-white`}>{card.value}</p>
              </div>
            ))}
          </div>

          {/* Megoszlás panel */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 border border-slate-100 dark:border-slate-800 shadow-xl">
            <h3 className="text-lg font-black uppercase italic tracking-tighter dark:text-white mb-8 border-b border-slate-50 dark:border-slate-800 pb-4">
              {t("profile.stats.activityDistribution", "Tevékenységek megoszlása")}
            </h3>
            
            <div className="space-y-6">
              {distributionItems.map((item) => {
                const itemData = stats[item.key as keyof typeof stats] as { total: number, bulk: number };
                
                // Százalékos számítások a csíkhoz
                const percentage = stats.totalActions > 0 ? (itemData.total / stats.totalActions) * 100 : 0;
                const bulkRatio = itemData.total > 0 ? (itemData.bulk / itemData.total) * 100 : 0;
                const normalRatio = 100 - bulkRatio;

                return (
                  <div key={item.key}>
                    <div className="flex justify-between items-end text-[10px] font-black uppercase mb-2 tracking-widest text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-3">
                        <span>{item.label}</span>
                        {itemData.bulk > 0 && (
                          <span className={`text-[8.5px] px-2 py-0.5 rounded-md text-white shadow-sm ${item.bulkColor}`}>
                            {itemData.bulk} {t("profile.stats.bulk", "tömeges")}
                          </span>
                        )}
                      </div>
                      <span>{itemData.total} ({percentage.toFixed(1)}%)</span>
                    </div>
                    
                    {/* Dupla csík a tömeges és normál műveletek elválasztásához */}
                    <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                      <div className="h-full flex transition-all duration-1000 ease-out" style={{ width: `${percentage}%` }}>
                        <div 
                          className={`h-full ${item.color}`} 
                          style={{ width: `${normalRatio}%` }} 
                          title={t("profile.stats.normal", "Normál műveletek")} 
                        />
                        <div 
                          className={`h-full ${item.bulkColor} opacity-90`} 
                          style={{ width: `${bulkRatio}%` }} 
                          title={t("profile.stats.bulkTitle", "Tömeges műveletek")} 
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
        </div>
      )}
    </div>
  );
};

export default ProfileStats;