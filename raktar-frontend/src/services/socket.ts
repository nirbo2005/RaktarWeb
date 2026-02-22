import { io } from "socket.io-client";

// localhost helyett a hálózati IP-t használjuk, hogy telefonról is elérhető legyen
const SOCKET_URL = "http://192.168.1.229:3000";

const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
});

export default socket;