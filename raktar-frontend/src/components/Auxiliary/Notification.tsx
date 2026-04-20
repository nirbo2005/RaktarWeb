// raktar-frontend/src/components/Auxiliary/Notification.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteReadNotifications,
} from "../../services/api";
import type { AppNotification } from "../../types/Notification";
import { useAuth } from "../../context/AuthContext";
import Swal from "sweetalert2";
import { useTranslation } from "react-i18next";

const toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2000,
  timerProgressBar: true,
  background: "rgb(15, 23, 42)",
  color: "#fff",
});

function Notifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user, refreshKey, triggerGlobalRefresh } = useAuth();
  const { t, i18n } = useTranslation();

  const currentLocale = i18n.language === "hu" ? "hu-HU" : "en-US";

  const fetchNotifications = () => {
    getMyNotifications()
      .then(setNotifications)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (user) fetchNotifications();
  }, [user, refreshKey]);

  // HAJSZÁLPONTOS FELDOLGOZÓ A TE JSON KULCSAIDHOZ:
const parseNotificationMessage = (uzenet: string): string => {
    if (!uzenet) return "";
    try {
      if (uzenet.startsWith("{")) {
        const payload = JSON.parse(uzenet);
        if (payload.key) return t(`auxiliary.notifications.${payload.key}`, payload.data) as string;
      }
    } catch (e) {}

    const text = uzenet.replace(/\n/g, " ");

    // --- FELHASZNÁLÓK ÉS BIZTONSÁG ---
    if (text.includes("Profil törölve:")) {
      const match = text.match(/Profil törölve: (.*?) \(@(.*?)\)/);
      if (match) return t("auxiliary.notifications.userDeleted", { nev: match[1].trim(), username: match[2].trim() });
    }
    if (text.includes("Új felhasználó regisztrált:")) {
      const match = text.match(/regisztrált: (.*?) \(@(.*?)\)/);
      if (match) return t("auxiliary.notifications.userRegistered", { nev: match[1].trim(), username: match[2].trim() });
    }
    if (text.includes("tiltva lett:") || text.includes("Felhasználó tiltva:")) {
      const match = text.match(/tiltva.*?: (.*?) \(@(.*?)\)/);
      if (match) return t("auxiliary.notifications.userBanned", { nev: match[1].trim(), username: match[2].trim() });
    }
    if (text.includes("tiltás feloldva:")) {
      const match = text.match(/feloldva.*?: (.*?) \(@(.*?)\)/);
      if (match) return t("auxiliary.notifications.userUnbanned", { nev: match[1].trim(), username: match[2].trim() });
    }
    if (text.includes("Biztonsági esemény:") && text.includes("elfelejtett jelszó")) {
      const match = text.match(/@(.*?) új ideiglenes/);
      if (match) return t("auxiliary.notifications.forgotPassword", { username: match[1].trim() });
    }
    if (text.includes("jelszavad biztonsági okokból sikeresen frissítve")) {
      return t("auxiliary.notifications.passwordChanged");
    }

    // --- JOGOSULTSÁG ÉS MÓDOSÍTÁSI KÉRELMEK ---
    if (text.includes("módosítási kérelem érkezett:")) {
      const match = text.match(/Új (.*?) módosítási kérelem érkezett: (.*?) \(@(.*?)\) -> (.*)/);
      if (match) return t("auxiliary.notifications.modRequest", { type: match[1].trim(), nev: match[2].trim(), username: match[3].trim(), ujErtek: match[4].trim() });
    }
    if (text.includes("módosítási kérelmed EL LETT FOGADVA")) {
      const match = text.match(/A\(z\) (.*?) módosítási kérelmed EL LETT FOGADVA.*?Új érték: (.*)/);
      if (match) return t("auxiliary.notifications.reqApproved", { type: match[1].trim(), ujErtek: match[2].trim() });
    }
    if (text.includes("módosítási kérelmed EL LETT UTASÍTVA")) {
      const match = text.match(/A\(z\) (.*?) módosítási kérelmed/);
      if (match) return t("auxiliary.notifications.reqRejected", { type: match[1].trim() });
    }

    // --- TERMÉKEK ÉS RAKTÁRKÉSZLET ---
    if (text.includes("LEJÁRT TERMÉK:") && text.includes("ma jár le")) {
      const prodPart = text.split("ma jár le")[0].replace("LEJÁRT TERMÉK:", "").replace("A(z)", "").trim();
      const parcelMatch = prodPart.match(/(.*)\s+\((.*?)\)$/);
      if (parcelMatch) return t("auxiliary.notifications.expiresToday", { nev: parcelMatch[1].trim(), parcella: parcelMatch[2].trim() });
    }
    if (text.includes("LEJÁRT TERMÉK:") && text.includes("már lejárt")) {
      const dateMatch = text.match(/ekkor: (.*?)!/);
      const datum = dateMatch ? dateMatch[1].trim() : "";
      const prodPart = text.split("már lejárt")[0].replace("LEJÁRT TERMÉK:", "").replace("A(z)", "").trim();
      const parcelMatch = prodPart.match(/(.*)\s+\((.*?)\)$/);
      if (parcelMatch) return t("auxiliary.notifications.expiredAlready", { nev: parcelMatch[1].trim(), parcella: parcelMatch[2].trim(), datum });
    }
    if (text.includes("LEJÁRATI FIGYELMEZTETÉS:")) {
      const dateMatch = text.match(/ekkor fog lejárni: (.*?)!/);
      const datum = dateMatch ? dateMatch[1].trim() : "";
      const prodPart = text.split("ekkor fog lejárni")[0].replace("LEJÁRATI FIGYELMEZTETÉS:", "").replace("A(z)", "").trim();
      const parcelMatch = prodPart.match(/(.*)\s+\((.*?)\)$/);
      if (parcelMatch) return t("auxiliary.notifications.expiringSoon", { nev: parcelMatch[1].trim(), parcella: parcelMatch[2].trim(), datum });
    }
    if (text.includes("KÉSZLETHIÁNY:")) {
      const match = text.match(/KÉSZLETHIÁNY: (.*?) teljesen elfogyott/);
      if (match) return t("auxiliary.notifications.outOfStock", { nev: match[1].trim() });
    }
    if (text.includes("ALACSONY KÉSZLET:")) {
      const match = text.match(/ALACSONY KÉSZLET: (.*?) a minimuma alá esett: (\d+)\s*\/\s*(\d+) db/);
      if (match) return t("auxiliary.notifications.lowStock", { nev: match[1].trim(), mennyiseg: match[2], min: match[3] });
    }

    return text;
  };

  const handleNavigate = async (notif: AppNotification) => {
    if (!notif.isRead) {
      await markNotificationAsRead(notif.id);
      triggerGlobalRefresh();
    }

    if (notif.productId) {
      navigate(`/product/${notif.productId}`);
      return;
    }

    const type = notif.tipus as string;
    const message = notif.uzenet?.toLowerCase() || "";

    if (type === "CHANGE_REQUEST" || type === "ADMIN_ACTION" || message.includes("kérelem") || message.includes("modrequest")) {
      if (user?.rang === "ADMIN") {
        navigate("/profile/admin");
      } else {
        navigate("/profile");
      }
      return;
    }

    switch (type) {
      case "STOCK_ALERT":
      case "EXPIRY_ALERT":
        navigate("/grid");
        break;
      case "SYSTEM":
        if (user?.rang === "ADMIN") {
          navigate("/profile/system");
        }
        break;
      case "USER_UPDATE":
        navigate("/profile");
        break;
      default:
        break;
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await markNotificationAsRead(id);
      triggerGlobalRefresh();
    } catch (err) {}
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      triggerGlobalRefresh();
      toast.fire({
        icon: "success",
        title: t("auxiliary.notifications.alerts.allMarkedRead"),
      });
    } catch (err) {}
  };

  const handleDeleteRead = async () => {
    const result = await Swal.fire({
      title: t("auxiliary.notifications.alerts.deleteConfirmTitle"),
      text: t("auxiliary.notifications.alerts.deleteConfirmText"),
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: t("auxiliary.notifications.alerts.yesDelete"),
      cancelButtonText: t("common.cancel"),
      customClass: {
        popup: "rounded-[2rem] bg-white dark:bg-slate-900 text-slate-900 dark:text-white",
        confirmButton: "bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-xl font-bold mx-2",
        cancelButton: "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-6 py-2 rounded-xl font-bold mx-2",
      },
      buttonsStyling: false,
    });

    if (result.isConfirmed) {
      try {
        setLoading(true);
        await deleteReadNotifications();
        triggerGlobalRefresh();
        toast.fire({
          icon: "success",
          title: t("auxiliary.notifications.alerts.deletedSuccess"),
        });
      } catch (err) {
      } finally {
        setLoading(false);
      }
    }
  };

  const getIconAndColor = (type: string) => {
    switch (type) {
      case "ERROR":
      case "ALERT":
      case "STOCK_ALERT":
      case "EXPIRY_ALERT":
        return {
          icon: "🚨",
          bg: "bg-red-50 dark:bg-red-900/20",
          border: "border-red-200 dark:border-red-900/50",
          text: "text-red-700 dark:text-red-400",
        };
      case "WARNING":
      case "CHANGE_REQUEST":
        return {
          icon: "⚠️",
          bg: "bg-amber-50 dark:bg-amber-900/20",
          border: "border-amber-200 dark:border-amber-900/50",
          text: "text-amber-700 dark:text-amber-400",
        };
      case "SUCCESS":
      case "ADMIN_ACTION":
        return {
          icon: "✅",
          bg: "bg-emerald-50 dark:bg-emerald-900/20",
          border: "border-emerald-200 dark:border-emerald-900/50",
          text: "text-emerald-700 dark:text-emerald-400",
        };
      default:
        return {
          icon: "ℹ️",
          bg: "bg-blue-50 dark:bg-blue-900/20",
          border: "border-blue-200 dark:border-blue-900/50",
          text: "text-blue-700 dark:text-blue-400",
        };
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const readCount = notifications.filter((n) => n.isRead).length;

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-10 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10 text-left">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="w-12 h-12 flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-500 hover:text-blue-600 transition-all shadow-sm"
            >
              ←
            </button>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">
                {t("auxiliary.notifications.title")}
              </h1>
              <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">
                {unreadCount > 0
                  ? t("auxiliary.notifications.unreadCount", { count: unreadCount })
                  : t("auxiliary.notifications.allRead")}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {readCount > 0 && (
              <button
                onClick={handleDeleteRead}
                className="bg-red-600 hover:bg-red-500 text-white px-5 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg transition-all active:scale-95"
              >
                {t("auxiliary.notifications.deleteReadBtn")}
              </button>
            )}
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg transition-all active:scale-95"
              >
                {t("auxiliary.notifications.markAllReadBtn")}
              </button>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-200 dark:border-slate-800 p-6 md:p-10">
          {notifications.length > 0 ? (
            <div className="space-y-4">
              {notifications.map((notif) => {
                const style = getIconAndColor(notif.tipus as string);
                return (
                  <div
                    key={notif.id}
                    className={`relative p-6 rounded-3xl border-2 transition-all flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between text-left ${
                      notif.isRead
                        ? "bg-slate-50 dark:bg-slate-800/30 border-transparent opacity-60"
                        : `${style.bg} ${style.border} shadow-sm`
                    }`}
                  >
                    {!notif.isRead && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></span>
                    )}

                    <div className="flex items-start gap-4 flex-1">
                      <div className="text-3xl mt-1">{style.icon}</div>
                      <div>
                        <p className={`text-sm md:text-base leading-tight ${notif.isRead ? "font-medium text-slate-600 dark:text-slate-400" : `font-black ${style.text}`}`}>
                          {parseNotificationMessage(notif.uzenet)}
                        </p>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-2 block">
                          {new Date(notif.letrehozva).toLocaleString(currentLocale)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-row items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-slate-700/50">
                      <button
                        onClick={() => handleMarkAsRead(notif.id)}
                        disabled={notif.isRead}
                        className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border ${
                          notif.isRead 
                            ? "bg-transparent border-slate-200 dark:border-slate-700 text-slate-400 cursor-not-allowed" 
                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95"
                        }`}
                      >
                        <span>✔️</span> {notif.isRead ? t("auxiliary.notifications.readStatus") : t("auxiliary.notifications.markAsRead")}
                      </button>

                      <button
                        onClick={() => handleNavigate(notif)}
                        className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2 active:scale-95"
                      >
                        {t("common.next")} <span className="text-sm leading-none">➔</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-20 text-center">
              <span className="text-6xl mb-4 block opacity-40">📭</span>
              <h3 className="text-xl font-black text-slate-800 dark:text-slate-200 uppercase tracking-tighter italic">
                {t("auxiliary.notifications.emptyTitle")}
              </h3>
              <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-2">
                {t("auxiliary.notifications.emptyText")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Notifications;