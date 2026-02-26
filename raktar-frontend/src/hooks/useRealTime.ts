//raktar-frontend/src/hooks/useRealTime.ts
import { useEffect } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";

const socket = io("http://localhost:3000"); 

export const useRealTime = (
  onProductUpdate: () => void,
  onNotificationUpdate: () => void,
) => {
  const { logout, user } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    socket.on("products_updated", () => {
      onProductUpdate();
    });

    socket.on("notifications_updated", (data) => {
      if (!data.userId || data.userId === user?.id) {
        onNotificationUpdate();
      }
    });

    socket.on("user_banned", (data) => {
      if (data.userId === user?.id) {
        logout();
        alert(t("hooks.realTime.alerts.accountSuspended"));
      }
    });

    socket.on("disconnect", () => {
      console.warn(t("hooks.realTime.alerts.connectionLost"));
    });

    return () => {
      socket.off("products_updated");
      socket.off("notifications_updated");
      socket.off("user_banned");
      socket.off("disconnect");
    };
  }, [user, logout, onProductUpdate, onNotificationUpdate, t]);
};
