import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const socket = io('http://localhost:3000'); // Backend URL

export const useRealTime = (onProductUpdate: () => void, onNotificationUpdate: () => void) => {
  const { logout, user } = useAuth();

  useEffect(() => {
    socket.on('products_updated', () => {
      onProductUpdate();
    });

    socket.on('notifications_updated', (data) => {
      // Csak ha ránk vonatkozik, vagy globális
      if (!data.userId || data.userId === user?.id) {
        onNotificationUpdate();
      }
    });

    // BANNOLÁS / KILÉPTETÉS kezelése
    socket.on('user_banned', (data) => {
      if (data.userId === user?.id) {
        logout();
        alert("A fiókodat felfüggesztették.");
      }
    });

    // ADATBÁZIS HIBA / SZERVER LEÁLLÁS
    socket.on('disconnect', () => {
      console.warn("Megszakadt a kapcsolat a szerverrel.");
    });

    return () => {
      socket.off('products_updated');
      socket.off('notifications_updated');
      socket.off('user_banned');
    };
  }, [user, logout, onProductUpdate, onNotificationUpdate]);
};