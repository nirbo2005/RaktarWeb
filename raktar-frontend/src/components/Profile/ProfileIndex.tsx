// raktar-frontend/src/components/Profile/ProfileIndex.tsx
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";

const ProfileIndex = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (!user) return null;

  const isAdmin = user.rang === "ADMIN";
  const isKezelo = user.rang === "KEZELO" || isAdmin;

  const getInitial = () => {
    return user?.nev ? user.nev.charAt(0).toUpperCase() : "?";
  };

  const menuCards = [
    {
      id: "details",
      title: t("profile.dashboard.details.title"),
      desc: t("profile.dashboard.details.desc"),
      icon: "👤",
      path: "/profile/details",
      show: true,
      color: "from-blue-500 to-indigo-600",
    },
    {
      id: "stats",
      title: t("profile.dashboard.stats.title"),
      desc: t("profile.dashboard.stats.desc"),
      icon: "📊",
      path: "/profile/stats",
      show: true,
      color: "from-purple-500 to-pink-600",
    },
    {
      id: "logs",
      title: t("profile.dashboard.logs.title"),
      desc: t("profile.dashboard.logs.desc"),
      icon: "📜",
      path: "/profile/logs",
      show: true,
      color: "from-amber-500 to-orange-600",
    },
    {
      id: "stock",
      title: t("profile.dashboard.stock.title"),
      desc: t("profile.dashboard.stock.desc"),
      icon: "💰",
      path: "/stock-value",
      show: isKezelo,
      color: "from-emerald-500 to-teal-600",
    },
    {
      id: "admin",
      title: t("profile.dashboard.admin.title"),
      desc: t("profile.dashboard.admin.desc"),
      icon: "🛡️",
      path: "/profile/admin",
      show: isAdmin,
      color: "from-slate-700 to-slate-900",
    },
    {
      id: "system",
      title: t("profile.dashboard.system.title"),
      desc: t("profile.dashboard.system.desc"),
      icon: "🖥️",
      path: "/profile/system",
      show: isAdmin,
      color: "from-cyan-500 to-blue-500",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-6 text-left transition-colors duration-300">
      <header className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 transition-all duration-500 relative">
        <div className="h-32 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800" />
        <div className="px-6 md:px-12 flex flex-col md:flex-row gap-4 md:gap-8 pb-8 md:pb-0">
          <div className="flex justify-center md:flex-col md:justify-end md:pb-4 -mt-16 z-10 shrink-0">
            <div className="w-28 h-28 bg-white dark:bg-slate-800 rounded-3xl shadow-2xl flex items-center justify-center text-5xl border-8 border-white dark:border-slate-900 font-black italic text-blue-600 shadow-blue-500/20">
              {getInitial()}
            </div>
          </div>
          <div className="flex-1 flex flex-col md:-mt-16">
            <div className="md:h-16 flex flex-col justify-center md:justify-end md:pb-2">
              <h1 className="text-2xl md:text-4xl font-black uppercase italic tracking-tight drop-shadow-md text-center md:text-left text-slate-900 dark:text-white md:text-white">
                {user?.nev || t("header.anonymous")}
              </h1>
            </div>
            <div className="md:h-16 flex flex-col md:flex-row items-center justify-between gap-4 mt-3 md:mt-0">
              <div className="flex flex-wrap justify-center md:justify-start items-center gap-3">
                <span className="text-slate-500 dark:text-slate-400 md:text-slate-300 font-bold text-[11px] uppercase tracking-widest bg-slate-100 dark:bg-slate-800/60 md:bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/50 backdrop-blur-sm transition-colors">
                  @{user?.felhasznalonev}
                </span>
                <span className="text-blue-600 dark:text-blue-400 font-black text-[10px] uppercase tracking-wider bg-blue-100 dark:bg-blue-900/30 px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800/50 backdrop-blur-sm transition-colors">
                  {isAdmin ? `🛡️ ${t("header.admin")}` : isKezelo ? `📦 ${t("header.handler")}` : `👁️ ${t("header.viewer")}`}
                </span>
              </div>
              <button
                onClick={() => logout()}
                className="w-full md:w-auto bg-red-500 hover:bg-red-600 text-white px-6 py-3 md:py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 border border-red-400/20"
              >
                <span>🚪</span> {t("header.logout")}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-2">
        {menuCards
          .filter((card) => card.show)
          .map((card) => (
            <div
              key={card.id}
              onClick={() => navigate(card.path)}
              className="group relative bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-2xl transition-all cursor-pointer overflow-hidden active:scale-95"
            >
              <div className={`absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 bg-gradient-to-br ${card.color} opacity-5 group-hover:opacity-20 rounded-full blur-2xl transition-all`} />
              <div className="flex flex-col h-full relative z-10">
                <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300 w-fit">
                  {card.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter mb-2">
                    {card.title}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs font-bold leading-relaxed uppercase tracking-wider opacity-80">
                    {card.desc}
                  </p>
                </div>
                <div className="mt-8 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    {t("common.open")} ➔
                  </span>
                  <div className="h-8 w-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 group-hover:text-white group-hover:bg-blue-600 transition-all">
                    →
                  </div>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default ProfileIndex;