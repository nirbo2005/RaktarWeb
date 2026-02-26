//raktar-frontend/src/components/Auxiliary/ConnectionStatus.tsx
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export const ConnectionStatus = () => {
  const [isOffline, setIsOffline] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    window.addEventListener("server-offline", handleOffline);
    window.addEventListener("server-online", handleOnline);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("server-offline", handleOffline);
      window.removeEventListener("server-online", handleOnline);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[10000] animate-in fade-in slide-in-from-right-8 duration-300">
      <div className="bg-red-500 text-white p-4 rounded-2xl shadow-2xl border-2 border-red-400 flex items-center gap-4">
        <div className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
        </div>
        <div className="flex flex-col">
          <span className="font-black uppercase text-xs tracking-widest">
            {t("auxiliary.connection.serverOffline")}
          </span>
          <span className="text-[10px] font-bold opacity-80 leading-none">
            {t("auxiliary.connection.reconnecting")}
          </span>
        </div>
      </div>
    </div>
  );
};
