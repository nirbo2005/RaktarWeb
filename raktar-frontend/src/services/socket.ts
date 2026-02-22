import { io } from "socket.io-client";
import { notifyServerOffline } from "./api";

// Használjuk ugyanazt a logikát az URL-re, mint az api.ts-ben a konzisztencia miatt
const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

/**
 * Socket.io kliens konfigurálása.
 */
export const socket = io(SOCKET_URL, {
  auth: (cb) => {
    // Dinamikus token lekérés minden csatlakozáskor/újracsatlakozáskor
    cb({ token: localStorage.getItem("token") });
  },
  autoConnect: true, // Alapértelmezett, de Senior szinten explicitté tesszük
  reconnection: true,
  reconnectionAttempts: Infinity, 
  reconnectionDelay: 2000,
  // Csak WebSocketet preferáljuk, ha lehetséges, a polling csak fallback
  transports: ["websocket", "polling"], 
});

/**
 * Kapcsolódási hiba kezelése.
 */
socket.on("connect_error", (error) => {
  // Ha a hiba oka hitelesítés (pl. lejárt vagy ideiglenes token korlátozása)
  if (error.message === "xhr poll error" || error.message === "Unauthorized") {
    console.warn("Socket auth hiba, de nem léptetünk ki kényszerítve az api.ts védelme miatt.");
  }
  
  console.warn("Socket kapcsolódási hiba:", error.message);
  notifyServerOffline(); 
});

/**
 * Sikeres kapcsolódás esemény.
 */
socket.on("connect", () => {
  console.log("Socket kapcsolat felépült:", socket.id);
  window.dispatchEvent(new CustomEvent('server-online'));
});

/**
 * Kapcsolat bontása esemény.
 */
socket.on("disconnect", (reason) => {
  console.log("Socket kapcsolat megszakadt:", reason);
  
  // Ha a szerver dob le minket vagy megszakad a hálózati réteg
  if (reason === "io server disconnect" || reason === "transport close" || reason === "transport error") {
    notifyServerOffline();
  }
});