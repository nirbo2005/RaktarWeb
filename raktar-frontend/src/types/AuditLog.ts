//raktar-frontend/src/types/AuditLog.ts
export interface AuditLog {
  id: number;
  muvelet: "CREATE" | "UPDATE" | "DELETE" | "RESTORE" | "BULK_DELETE";
  idopont: string;
  stockId: number | null;
  userId: number;
  user: {
    nev: string;
    felhasznalonev?: string;
  };
  stock: {
    nev: string;
  } | null;
  termekNev?: string;
  regiAdat: any | null;
  ujAdat: any | null;
  isGroup?: boolean;
  count?: number;
  items?: AuditLog[];
}