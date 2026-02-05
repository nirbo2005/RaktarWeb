export interface AuditLog {
  id: number;
  muvelet: "CREATE" | "UPDATE" | "DELETE" | "RESTORE";
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
  regiAdat: any | null;
  ujAdat: any | null;
}
