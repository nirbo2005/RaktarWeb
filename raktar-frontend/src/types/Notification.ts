// raktar-frontend/src/types/Notification.ts
export type NotificationType =
  | "INFO"
  | "WARNING"
  | "SUCCESS"
  | "ERROR"
  | "ALERT";

export type AppNotification = {
  id: number;
  userId: number;
  productId?: number | null; // Ez a mező kell a navigációhoz
  uzenet: string;
  tipus: NotificationType;
  isRead: boolean;
  letrehozva: string | Date;
};