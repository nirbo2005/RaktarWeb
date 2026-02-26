//raktar-frontend/src/components/Auxiliary/Notification.tsx
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
  const { t } = useTranslation();

  const fetchNotifications = () => {
    getMyNotifications()
      .then(setNotifications)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (user) fetchNotifications();
  }, [user, refreshKey]);

  const handleNotificationClick = async (notif: AppNotification) => {
    if (!notif.isRead) {
      await markNotificationAsRead(notif.id);
      triggerGlobalRefresh();
    }
    
    if (notif.productId) {
      navigate(`/product/${notif.productId}`);
    }
  };

  const handleMarkAsRead = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
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
        return {
          icon: "🚨",
          bg: "bg-red-50 dark:bg-red-900/20",
          border: "border-red-200 dark:border-red-900/50",
          text: "text-red-700 dark:text-red-400",
        };
      case "WARNING":
        return {
          icon: "⚠️",
          bg: "bg-amber-50 dark:bg-amber-900/20",
          border: "border-amber-200 dark:border-amber-900/50",
          text: "text-amber-700 dark:text-amber-400",
        };
      case "SUCCESS":
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
                const style = getIconAndColor(notif.tipus);
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`relative p-6 rounded-3xl border-2 transition-all flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between text-left cursor-pointer hover:scale-[1.01] ${
                      notif.isRead
                        ? "bg-slate-50 dark:bg-slate-800/30 border-transparent opacity-60"
                        : `${style.bg} ${style.border} shadow-sm`
                    }`}
                  >
                    {!notif.isRead && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></span>
                    )}

                    <div className="flex items-start gap-4">
                      <div className="text-3xl mt-1">{style.icon}</div>
                      <div>
                        <p className={`text-sm md:text-base leading-tight ${notif.isRead ? "font-medium text-slate-600 dark:text-slate-400" : `font-black ${style.text}`}`}>
                          {notif.uzenet}
                        </p>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-2 block">
                          {new Date(notif.letrehozva).toLocaleString("hu-HU")}
                        </span>
                      </div>
                    </div>

                    {!notif.isRead && (
                      <button
                        onClick={(e) => handleMarkAsRead(e, notif.id)}
                        className="shrink-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        {t("auxiliary.notifications.acknowledge")}
                      </button>
                    )}
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