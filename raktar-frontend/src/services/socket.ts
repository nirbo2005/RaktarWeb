//raktar-frontend/src/services/socket.ts
import { io } from "socket.io-client";
import { notifyServerOffline } from "./api";

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export const socket = io(SOCKET_URL, {
  auth: (cb) => {
    cb({ token: localStorage.getItem("token") });
  },
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 2000,
  transports: ["websocket", "polling"],
});

socket.on("connect_error", (error) => {
  if (error.message === "xhr poll error" || error.message === "Unauthorized") {
    console.warn(
      "Socket auth hiba, de nem léptetünk ki kényszerítve az api.ts védelme miatt.",
    );
  }

  console.warn("Socket kapcsolódási hiba:", error.message);
  notifyServerOffline();
});

socket.on("connect", () => {
  console.log("Socket kapcsolat felépült:", socket.id);
  window.dispatchEvent(new CustomEvent("server-online"));
});

socket.on("disconnect", (reason) => {
  console.log("Socket kapcsolat megszakadt:", reason);

  if (
    reason === "io server disconnect" ||
    reason === "transport close" ||
    reason === "transport error"
  ) {
    notifyServerOffline();
  }
});
