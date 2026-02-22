export type NotificationType = "INFO" | "WARNING" | "SUCCESS" | "ERROR" | "ALERT";

export type AppNotification = {
  id: number;
  userId: number;
  uzenet: string;
  tipus: NotificationType;
  isRead: boolean;
  letrehozva: string | Date;
};