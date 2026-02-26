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
    creates: 0,
    updates: 0,
    deletes: 0,
  });
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    if (!user) return;
    try {
      // Csak a saját logokat kérjük le a statisztikához
      const logs = await getAuditLogs(user.id, false, { targetUserId: user.id.toString() });
      
      const counts = logs.reduce((acc: any, log: any) => {
        acc.total++;
        if (log.muvelet.includes("CREATE")) acc.creates++;
        if (log.muvelet.includes("UPDATE")) acc.updates++;
        if (log.muvelet.includes("DELETE")) acc.deletes++;
        return acc;
      }, { total: 0, creates: 0, updates: 0, deletes: 0 });

      setStats({
        totalActions: counts.total,
        creates: counts.creates,
        updates: counts.updates,
        deletes: counts.deletes,
      });
    } catch (err) {
      console.error("Hiba a statisztikák számításakor:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useAutoRefresh(loadStats);

  const statCards = [
    { label: t("profile.stats.totalActions"), value: stats.totalActions, icon: "⚡", color: "blue" },
    { label: t("profile.stats.creates"), value: stats.creates, icon: "🆕", color: "emerald" },
    { label: t("profile.stats.updates"), value: stats.updates, icon: "📝", color: "amber" },
    { label: t("profile.stats.deletes"), value: stats.deletes, icon: "🗑️", color: "rose" },
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
          {t("profile.dashboard.stats.title")}
        </h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-500">
          {/* FŐ STATISZTIKAI RÁCS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((card, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                <div className={`absolute -right-4 -top-4 text-6xl opacity-10 group-hover:scale-110 transition-transform`}>{card.icon}</div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-2">{card.label}</p>
                <p className={`text-4xl font-black italic dark:text-white`}>{card.value}</p>
              </div>
            ))}
          </div>

          {/* AKTIVITÁSI ÖSSZEGZŐ */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 border border-slate-100 dark:border-slate-800 shadow-xl">
            <h3 className="text-lg font-black uppercase italic tracking-tighter dark:text-white mb-8 border-b border-slate-50 dark:border-slate-800 pb-4">
              {t("profile.stats.activityDistribution")}
            </h3>
            <div className="space-y-6">
              {[
                { type: "creates", color: "bg-emerald-500" },
                { type: "updates", color: "bg-amber-500" },
                { type: "deletes", color: "bg-rose-500" },
              ].map((item) => {
                const percentage = stats.totalActions > 0 ? (stats[item.type as keyof typeof stats] / stats.totalActions) * 100 : 0;
                return (
                  <div key={item.type}>
                    <div className="flex justify-between text-[10px] font-black uppercase mb-2 tracking-widest text-slate-500">
                      <span>{t(`profile.stats.${item.type}`)}</span>
                      <span>{percentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${item.color} transition-all duration-1000 ease-out`}
                        style={{ width: `${percentage}%` }}
                      />
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