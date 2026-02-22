export interface AuditLog {
  id: number;
  muvelet: "CREATE" | "UPDATE" | "DELETE" | "RESTORE" | "BULK_DELETE";
  idopont: string;
  // A backend most már productId-t küld
  productId: number | null; 
  stockId?: number | null; // Megtartjuk a kompatibilitás miatt
  userId: number;
  user: {
    nev: string;
    felhasznalonev?: string;
  };
  // A backend 'product' néven küldi az include miatt
  product?: {
    nev: string;
  } | null;
  // Megtartjuk a stock-ot is, ha esetleg máshol még kell
  stock?: {
    nev: string;
  } | null;
  termekNev?: string;
  regiAdat: any | null;
  ujAdat: any | null;
  isGroup?: boolean;
  count?: number;
  items?: AuditLog[];
}