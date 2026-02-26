//raktar-frontend/src/types/AuditLog.ts
export interface AuditLog {
  id: number;
  muvelet: "PRODUCT_CREATE" | "PRODUCT_UPDATE" | "PRODUCT_DELETE" | "PRODUCT_RESTORE" | "PRODUCT_BULK_DELETE" | "BATCH_CREATE" | "BATCH_UPDATE" | "BATCH_DELETE";
  idopont: string;
  productId: number | null;
  userId: number;
  user: {
    id: number;
    nev: string;
    felhasznalonev: string;
  };
  product?: {
    id: number;
    nev: string;
  } | null;
  regiAdat: any | null;
  ujAdat: any | null;
}