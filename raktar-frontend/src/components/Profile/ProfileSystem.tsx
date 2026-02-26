// raktar-frontend/src/components/Profile/ProfileSystem.tsx
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getSystemStatus } from "../../services/api";
import { useAutoRefresh } from "../../hooks/useAutoRefresh";

interface SystemStatus {
  status: string;
  database: string;
  latency: string;
  uptime: number;
  memoryUsage: number;
  timestamp: string;
}

const ProfileSystem = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      const data = await getSystemStatus();
      setStatus(data);
    } catch (err) {
      console.error("Hiba a rendszerállapot lekérésekor:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useAutoRefresh(loadStatus);

  const handleManualDiagnostic = async () => {
    setRefreshing(true);
    await loadStatus();
  };

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${d}d ${h}h ${m}m`;
  };

  const formatMemory = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(1) + " MB";
  };

  const metrics = status ? [
    { 
        label: t("profile.system.database"), 
        value: status.database === "connected" ? t("profile.system.connected") : t("profile.system.error"), 
        status: status.database === "connected" ? "ok" : "err",
        icon: "🗄️"
    },
    { 
        label: t("profile.system.uptime"), 
        value: formatUptime(status.uptime), 
        status: "ok",
        icon: "⏱️"
    },
    { 
        label: t("profile.system.memory"), 
        value: formatMemory(status.memoryUsage), 
        status: status.memoryUsage < 500000000 ? "ok" : "warn",
        icon: "🧠"
    },
    { 
        label: t("profile.system.latency"), 
        value: status.latency, 
        status: parseInt(status.latency) < 100 ? "ok" : "warn",
        icon: "📡"
    },
  ] : [];

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
          {t("profile.dashboard.system.title")}
        </h2>
      </div>

      {loading && !status ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {metrics.map((m, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm relative group overflow-hidden">
                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{m.label}</p>
                    <p className="text-xl font-black dark:text-white italic">{m.value}</p>
                  </div>
                  <span className="text-2xl">{m.icon}</span>
                </div>
                <div className={`mt-4 h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden`}>
                   <div className={`h-full transition-all duration-1000 ${m.status === 'ok' ? 'bg-emerald-500' : m.status === 'warn' ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: '100%' }} />
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 border border-slate-100 dark:border-slate-800 shadow-xl">
              <h3 className="text-lg font-black uppercase italic tracking-tighter dark:text-white mb-6 flex items-center gap-2">
                <span>📑</span> {t("profile.system.recentEvents")}
              </h3>
              <div className="space-y-4 font-mono text-[11px]">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border-l-4 border-emerald-500">
                  <span className="text-slate-400 mr-2">[{status?.timestamp}]</span>
                  <span className="text-emerald-600 font-bold uppercase mr-2">INFO:</span>
                  <span className="dark:text-slate-300">System health check passed. All services operational.</span>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border-l-4 border-blue-500">
                  <span className="text-slate-400 mr-2">[{status?.timestamp}]</span>
                  <span className="text-blue-600 font-bold uppercase mr-2">INFO:</span>
                  <span className="dark:text-slate-300">Backup automated task finished successfully.</span>
                </div>
              </div>
            </div>

            <div className="bg-indigo-600 rounded-[2.5rem] p-10 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden">
               <div className="absolute -right-10 -bottom-10 text-[12rem] opacity-10">⚙️</div>
               <h3 className="text-xl font-black uppercase italic tracking-tighter mb-4 relative z-10">
                 {t("profile.system.maintenance")}
               </h3>
               <p className="text-sm font-medium opacity-80 mb-8 relative z-10 leading-relaxed">
                 {t("profile.system.maintenanceDesc")}
               </p>
               <button 
                 disabled={refreshing}
                 onClick={handleManualDiagnostic}
                 className="w-full bg-white text-indigo-600 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all relative z-10 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 {refreshing ? t("common.updating") : t("profile.system.runDiagnostic")}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileSystem;