// raktar-frontend/src/components/Profile/ProfileIndex.tsx
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import ProfileAvatar from "./ProfileAvatar";

const ProfileIndex = () => {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (!user) return null;

  const isAdmin = user.rang === "ADMIN";
  const isKezelo = user.rang === "KEZELO" || isAdmin;

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
      show: isAdmin,
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
    <div className="min-h-screen bg-main pt-4 transition-colors duration-300">
      <div className="max-w-6xl mx-auto space-y-8 py-6 text-left px-4">
        <header className="bg-panel rounded-[2.5rem] shadow-xl overflow-hidden border border-border-main relative transition-all duration-500">
          <div className="h-32 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800" />
          <div className="px-6 md:px-12 flex flex-col md:flex-row gap-6 md:gap-8 pb-8">
            <div className="flex justify-center md:justify-end -mt-16 z-10 shrink-0">
              <div className="w-32 h-32 md:w-40 md:h-40">
                <ProfileAvatar user={user} onUploadSuccess={(updated) => setUser(updated)} />
              </div>
            </div>
            
            <div className="flex-1 flex flex-col md:mt-4">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-3 text-center md:text-left">
                  <h1 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter text-main">
                    {user?.nev || t("header.anonymous")}
                  </h1>
                  <div className="flex flex-wrap justify-center md:justify-start items-center gap-2">
                    <span className="text-muted font-bold text-[10px] uppercase tracking-widest bg-input px-3 py-1 rounded-lg border border-border-main">
                      @{user?.felhasznalonev}
                    </span>
                    <span className="text-blue-600 dark:text-blue-400 font-black text-[10px] uppercase tracking-wider bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-lg border border-blue-100 dark:border-blue-800/30">
                      {isAdmin ? `🛡️ ${t("header.admin")}` : isKezelo ? `📦 ${t("header.handler")}` : `👁️ ${t("header.viewer")}`}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => logout()}
                  className="w-full md:w-auto bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
                >
                  <span>🚪</span> {t("header.logout")}
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuCards
            .filter((card) => card.show)
            .map((card) => (
              <div
                key={card.id}
                onClick={() => navigate(card.path)}
                className="group relative bg-panel rounded-[2.5rem] p-8 border border-border-main shadow-sm hover:shadow-2xl transition-all cursor-pointer overflow-hidden active:scale-95"
              >
                <div className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 bg-gradient-to-br ${card.color} opacity-5 group-hover:opacity-15 rounded-full blur-3xl transition-all`} />
                
                <div className="flex flex-col h-full relative z-10">
                  <div className="text-5xl mb-8 transform group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300 w-fit">
                    {card.icon}
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <h3 className="text-2xl font-black text-main uppercase italic tracking-tighter">
                      {card.title}
                    </h3>
                    <p className="text-muted text-[11px] font-bold leading-relaxed uppercase tracking-wide opacity-80">
                      {card.desc}
                    </p>
                  </div>

                  <div className="mt-10 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
                      {t("common.open")} ➔
                    </span>
                    <div className="h-10 w-10 rounded-2xl bg-input flex items-center justify-center text-muted group-hover:text-white group-hover:bg-blue-600 transition-all border border-border-main shadow-inner">
                      →
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default ProfileIndex;